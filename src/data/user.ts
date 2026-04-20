export interface MockUser {
  name: string;
  initials: string;
  specialty: string;
  crm: string;
  email: string;
}

export const mockUser: MockUser = {
  name: "Dr. João Silva",
  initials: "JS",
  specialty: "Clínica Geral",
  crm: "CRM 123456-SP",
  email: "joao.silva@hipocrates.ai",
};
