import { AppError } from "../../utils/AppError.js";

import {
  findUserForBillingById,
  updateUserAsaasCustomerId,
  type BillingUser,
} from "../../repositories/userBillingRepository.js";

import { asaasRequest } from "./asaasClient.js";

type AsaasCustomerRequest = {
  name: string;
  email?: string;
  cpfCnpj: string;
  externalReference: string;
  notificationDisabled?: boolean;
  observations?: string;
};

type AsaasCustomerResponse = {
  object: "customer";
  id: string;
  dateCreated?: string;
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

function getDefaultCustomerCpfCnpj() {
  const cpfCnpj = (
    process.env.ASAAS_DEFAULT_CUSTOMER_CPF_CNPJ ?? ""
  ).replace(/\D/g, "");

  if (!cpfCnpj) {
    throw new AppError(
      "ASAAS_DEFAULT_CUSTOMER_CPF_CNPJ não configurado no .env",
      500,
    );
  }

  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    throw new AppError(
      "ASAAS_DEFAULT_CUSTOMER_CPF_CNPJ deve ter 11 dígitos para CPF ou 14 dígitos para CNPJ",
      500,
    );
  }

  return cpfCnpj;
}

function buildAsaasCustomerPayload(user: BillingUser): AsaasCustomerRequest {
  const payload: AsaasCustomerRequest = {
    name: user.name,
    cpfCnpj: getDefaultCustomerCpfCnpj(),
    externalReference: user.id,
    notificationDisabled: false,
    observations: `Cliente criado automaticamente pelo Serviu. Usuário ID: ${user.id}`,
  };

  if (user.email) {
    payload.email = user.email;
  }

  return payload;
}

export async function createAsaasCustomerForOwner(user: BillingUser) {
  const payload = buildAsaasCustomerPayload(user);

  return asaasRequest<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: payload,
  });
}

export async function updateAsaasCustomerForOwner(
  user: BillingUser,
  asaasCustomerId: string,
) {
  const payload = buildAsaasCustomerPayload(user);

  return asaasRequest<AsaasCustomerResponse>(`/customers/${asaasCustomerId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function getOrCreateAsaasCustomerForOwnerService(
  ownerUserId: string,
) {
  const user = await findUserForBillingById(ownerUserId);

  if (!user) {
    throw new AppError("Cliente/dono não encontrado", 404);
  }

  if (user.asaas_customer_id) {
    const asaasCustomer = await updateAsaasCustomerForOwner(
      user,
      user.asaas_customer_id,
    );

    return {
      owner: user,
      asaas_customer_id: user.asaas_customer_id,
      created: false,
      asaas_customer: asaasCustomer,
    };
  }

  const asaasCustomer = await createAsaasCustomerForOwner(user);

  if (!asaasCustomer.id) {
    throw new AppError("Asaas não retornou o ID do cliente", 502);
  }

  const updatedUser = await updateUserAsaasCustomerId(user.id, asaasCustomer.id);

  return {
    owner: updatedUser,
    asaas_customer_id: asaasCustomer.id,
    created: true,
    asaas_customer: asaasCustomer,
  };
}