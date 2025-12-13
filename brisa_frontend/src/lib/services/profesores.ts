import { http } from './http';

export type Profesor = {
    id_profesor: number;
    id_persona: number;
    ci: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    id_cargo?: number;
    estado_laboral?: string;
    anos_experiencia?: number; // Backend uses 'anos', avoiding 'años' for consistency with DTO
    fecha_ingreso?: string;
    especialidad?: string;
    titulo_academico?: string;
    nivel_enseñanza?: string;
    observaciones?: string;
};

export type ProfesorCreate = {
    ci: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    id_cargo?: number;
    estado_laboral?: string;
    anos_experiencia?: number;
    fecha_ingreso?: string;
    especialidad?: string;
    titulo_academico?: string;
    nivel_enseñanza?: string;
    observaciones?: string;
};

export type ProfesorUpdate = Partial<ProfesorCreate>;

export type Asignacion = {
    id_profesor: number;
    id_curso: number;
    id_materia: number;
    nombre_profesor?: string;
    nombre_curso?: string;
    nombre_materia?: string;
};

export type AsignarCursoMateria = {
    id_profesor: number;
    id_curso: number;
    id_materia: number;
};

export const profesoresService = {
    getProfesores: async (): Promise<Profesor[]> => http.get('/profesores'),

    getProfesor: async (id: number): Promise<Profesor> => http.get(`/profesores/${id}`),

    createProfesor: async (data: ProfesorCreate): Promise<Profesor> => http.post('/profesores', data),

    updateProfesor: async (id: number, data: ProfesorUpdate): Promise<Profesor> =>
        http.put(`/profesores/${id}`, data),

    deleteProfesor: async (id: number): Promise<void> => http.del(`/profesores/${id}`),

    // Asignaciones
    getAsignaciones: async (id_profesor: number): Promise<Asignacion[]> =>
        http.get(`/profesores/${id_profesor}/asignaciones`),

    asignarCursoMateria: async (data: AsignarCursoMateria): Promise<Asignacion> =>
        http.post('/profesores/asignar-curso-materia', data),

    eliminarAsignacion: async (
        id_profesor: number,
        id_curso: number,
        id_materia: number
    ): Promise<void> => {
        await http.del(`/profesores/${id_profesor}/asignaciones/${id_curso}/${id_materia}`);
    }
};
