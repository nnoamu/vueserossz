// Auto-generated TypeScript interfaces from C# DTOs
// Source: GlosterIktato.API/DTOs/Auth/*.cs

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
  user: UserDto;
}

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  companies: CompanyDto[];
  roles: string[];
}

export interface CompanyDto {
  id: number;
  name: string;
  taxNumber: string;
}
