/**
 * Multi-établissement : Société > Succursale > Poste de travail.
 * Miroir direct des DTO backend (CompanyDto/BranchDto/WorkstationDto) — pas de
 * mapping nécessaire, les champs correspondent déjà 1:1.
 */
export interface Company {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface Branch {
  id: number;
  companyId: number;
  companyName: string;
  name: string;
  address: string | null;
  phone: string | null;
}

/** type : libre côté backend ("pos", "kitchen", "kds"...), pas une enum stricte. */
export interface Workstation {
  id: number;
  branchId: number;
  branchName: string;
  name: string;
  type: string;
  ip: string | null;
}
