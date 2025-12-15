from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class CursoBaseDTO(BaseModel):
    nombre_curso: str = Field(..., min_length=1, max_length=50)
    nivel: str = Field(..., min_length=1, max_length=50)
    gestion: str = Field(..., min_length=4, max_length=20)

class CursoCreateDTO(CursoBaseDTO):
    pass

class CursoUpdateDTO(CursoBaseDTO):
    pass

class CursoDTO(CursoBaseDTO):
    id_curso: int
    
    model_config = ConfigDict(from_attributes=True)

class EstudianteDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id_estudiante: int
    ci: Optional[str] = None
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    
    @property
    def nombre_completo(self) -> str:
        apellidos = f"{self.apellido_paterno} {self.apellido_materno or ''}".strip()
        return f"{self.nombres} {apellidos}"


class ProfesorDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id_persona: int
    ci: str
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    
    @property
    def nombre_completo(self) -> str:
        apellidos = f"{self.apellido_paterno} {self.apellido_materno or ''}".strip()
        return f"{self.nombres} {apellidos}"


class EstudianteListResponseDTO(BaseModel):
    """DTO para respuesta paginada de estudiantes"""
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[EstudianteDTO]


class ProfesorListResponseDTO(BaseModel):
    """DTO para respuesta paginada de profesores"""
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[ProfesorDTO]
