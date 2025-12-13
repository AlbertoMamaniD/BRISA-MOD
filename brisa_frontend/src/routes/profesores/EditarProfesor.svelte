<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import Toast from "$lib/components/Toast.svelte";
    import {
        profesoresService,
        type Profesor,
        type Asignacion,
    } from "$lib/services/profesores.js";
    import { administrativosService } from "$lib/services/administrativos.js";
    import { getIconSvg } from "$lib/components/svg.js";
    import AsignarCursos from "./AsignarCursos.svelte";

    export let profesor: Profesor;

    const dispatch = createEventDispatcher<{
        save: Profesor;
        cancel: void;
        delete: { id: number };
    }>();

    let profesorData: any = {
        ci: "",
        nombres: "",
        apellido_paterno: "",
        apellido_materno: "",
        direccion: "",
        telefono: "",
        correo: "",
        id_cargo: null,
        estado_laboral: "activo",
        anos_experiencia: 0,
        fecha_ingreso: "",
        especialidad: "",
        titulo_academico: "",
        nivel_enseñanza: "todos",
        observaciones: "",
    };

    let asignaciones: Asignacion[] = [];
    let cargandoAsignaciones = false;

    let cargos: any[] = [];
    let cargandoCargos = false;

    let guardando = false;
    let eliminando = false;
    let eliminandoAsignacion: string | null = null; // Key for loading state

    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";

    let mostrarModalAsignar = false;

    onMount(async () => {
        if (profesor) {
            profesorData = { ...profesor };
            // Fix nulls
            if (!profesorData.nivel_enseñanza)
                profesorData.nivel_enseñanza = "todos";
        }
        await Promise.all([cargarCargos(), cargarAsignaciones()]);
    });

    async function cargarCargos() {
        try {
            cargos = await administrativosService.getCargos();
        } catch {}
    }

    async function cargarAsignaciones() {
        cargandoAsignaciones = true;
        try {
            asignaciones = await profesoresService.getAsignaciones(
                profesor.id_profesor,
            );
        } catch (error) {
            console.error("Error cargando asignaciones", error);
        } finally {
            cargandoAsignaciones = false;
        }
    }

    async function guardar() {
        guardando = true;
        try {
            const data = {
                ...profesorData, // Includes basic fields
                ci: profesorData.ci?.trim(),
                nombres: profesorData.nombres?.trim(),
                apellido_paterno: profesorData.apellido_paterno?.trim(),
                id_cargo: profesorData.id_cargo
                    ? Number(profesorData.id_cargo)
                    : undefined,
                anos_experiencia: Number(profesorData.anos_experiencia) || 0,
            };

            const saved = await profesoresService.updateProfesor(
                profesor.id_profesor,
                data,
            );
            toastMessage = "Profesor actualizado exitosamente";
            toastType = "success";
            setTimeout(() => {
                dispatch("save", saved);
            }, 1000);
        } catch (error: any) {
            console.error(error);
            toastMessage = error.message || "Error al actualizar";
            toastType = "error";
        } finally {
            guardando = false;
        }
    }

    async function eliminarProfesor() {
        if (!confirm("¿Está seguro de eliminar este profesor permanently?"))
            return;
        eliminando = true;
        try {
            await profesoresService.deleteProfesor(profesor.id_profesor);
            toastMessage = "Profesor eliminado";
            toastType = "success";
            setTimeout(() => {
                dispatch("delete", { id: profesor.id_profesor });
            }, 1000);
        } catch (error: any) {
            toastMessage = error.message || "Error al eliminar";
            toastType = "error";
        } finally {
            eliminando = false;
        }
    }

    async function eliminarAsignacion(items: Asignacion) {
        if (
            !confirm(
                `¿Quitar asignación de ${items.nombre_materia} en ${items.nombre_curso}?`,
            )
        )
            return;
        const key = `${items.id_curso}-${items.id_materia}`;
        eliminandoAsignacion = key;
        try {
            await profesoresService.eliminarAsignacion(
                profesor.id_profesor,
                items.id_curso,
                items.id_materia,
            );
            await cargarAsignaciones();
            toastMessage = "Asignación eliminada";
            toastType = "success";
        } catch (error: any) {
            toastMessage = error.message || "Error al eliminar asignación";
            toastType = "error";
        } finally {
            eliminandoAsignacion = null;
        }
    }

    function handleAsignacionGuardada() {
        mostrarModalAsignar = false;
        cargarAsignaciones();
        toastMessage = "Carga asignada correctamente";
        toastType = "success";
    }
</script>

<div class="editar-profesor-container">
    <div class="editar-profesor">
        <div class="header">
            <div class="icon-title">
                <div class="icon">✏️</div>
                <div>
                    <h2>Editar Profesor</h2>
                    <p>{profesor.nombres} {profesor.apellido_paterno}</p>
                </div>
            </div>
            <div class="actions">
                <button
                    class="btn-delete"
                    on:click={eliminarProfesor}
                    disabled={eliminando || guardando}
                >
                    {#if eliminando}Eliminando...{:else}Eliminar{/if}
                </button>
                <button
                    class="btn-outline"
                    on:click={() => dispatch("cancel")}
                    disabled={guardando}>Cancelar</button
                >
                <button
                    class="btn-primary"
                    on:click={guardar}
                    disabled={guardando}
                >
                    {#if guardando}Guardando...{:else}Actualizar{/if}
                </button>
            </div>
        </div>

        <div class="content-grid">
            <!-- COLUMNA IZQUIERDA: FORMULARIO -->
            <div class="form-column">
                <section>
                    <h3>Datos Personales</h3>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>CI</label>
                            <input
                                type="text"
                                bind:value={profesorData.ci}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Estado Laboral</label>
                            <select
                                bind:value={profesorData.estado_laboral}
                                disabled={guardando}
                            >
                                <option value="activo">Activo</option>
                                <option value="retirado">Inactivo</option>
                                <option value="licencia">Licencia</option>
                                <option value="suspendido">Suspendido</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombres</label>
                            <input
                                type="text"
                                bind:value={profesorData.nombres}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Apellido Paterno</label>
                            <input
                                type="text"
                                bind:value={profesorData.apellido_paterno}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Apellido Materno</label>
                            <input
                                type="text"
                                bind:value={profesorData.apellido_materno}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Correo</label>
                            <input
                                type="email"
                                bind:value={profesorData.correo}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                bind:value={profesorData.telefono}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                </section>

                <br />

                <section>
                    <h3>Perfil Académico</h3>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Especialidad</label>
                            <input
                                type="text"
                                bind:value={profesorData.especialidad}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Nivel de Enseñanza</label>
                            <select
                                bind:value={profesorData.nivel_enseñanza}
                                disabled={guardando}
                            >
                                <option value="todos">Todos</option>
                                <option value="foundation">Inicial</option>
                                <option value="primary">Primaria</option>
                                <option value="secondary">Secundaria</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                bind:value={profesorData.titulo_academico}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Años Exp.</label>
                            <input
                                type="number"
                                bind:value={profesorData.anos_experiencia}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Fecha de Ingreso</label>
                            <input
                                type="date"
                                bind:value={profesorData.fecha_ingreso}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Cargo</label>
                            <select
                                bind:value={profesorData.id_cargo}
                                disabled={guardando || cargandoCargos}
                            >
                                <option value={null}>Sin cargo</option>
                                {#each cargos as cargo}
                                    <option value={cargo.id_cargo}
                                        >{cargo.nombre_cargo}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                </section>
            </div>

            <!-- COLUMNA DERECHA: ASIGNACIONES -->
            <div class="assignments-column">
                <section class="full-height">
                    <div class="assignments-header">
                        <h3>Carga Académica</h3>
                        <button
                            class="btn-small-primary"
                            on:click={() => (mostrarModalAsignar = true)}
                        >
                            + Asignar
                        </button>
                    </div>

                    <div class="assignments-list">
                        {#if cargandoAsignaciones}
                            <p class="muted">Cargando...</p>
                        {:else if asignaciones.length === 0}
                            <div class="empty-assignments">
                                <p>Sin asignaciones activas</p>
                            </div>
                        {:else}
                            {#each asignaciones as a}
                                <div class="assignment-item">
                                    <div class="asig-info">
                                        <span class="materia"
                                            >{a.nombre_materia}</span
                                        >
                                        <span class="curso"
                                            >{a.nombre_curso}</span
                                        >
                                    </div>
                                    <button
                                        class="btn-icon-delete"
                                        disabled={eliminandoAsignacion ===
                                            `${a.id_curso}-${a.id_materia}`}
                                        on:click={() => eliminarAsignacion(a)}
                                    >
                                        {@html getIconSvg("trash")}
                                    </button>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </section>
            </div>
        </div>
    </div>
</div>

{#if mostrarModalAsignar}
    <AsignarCursos
        {profesor}
        on:close={() => (mostrarModalAsignar = false)}
        on:saved={handleAsignacionGuardada}
    />
{/if}

<Toast message={toastMessage} type={toastType} />

<style>
    .editar-profesor-container {
        background: #f8fafc;
        padding: 20px;
    }

    .editar-profesor {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        max-width: 1100px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
    }

    .icon-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .icon {
        width: 40px;
        height: 40px;
        background: #e6f7fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    h2 {
        margin: 0;
        font-size: 1.15rem;
        color: #1e293b;
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    .content-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
    }

    @media (max-width: 800px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
    }

    section {
        background: #fafbfc;
        padding: 18px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .full-height {
        height: 100%;
        box-sizing: border-box;
    }

    h3 {
        margin: 0 0 16px;
        font-size: 1rem;
        color: #334155;
        font-weight: 600;
    }

    /* Form styles similar to Create */
    .form-row {
        display: grid;
        gap: 16px;
        margin-bottom: 12px;
    }
    .form-row.single {
        grid-template-columns: 1fr 1fr;
    }
    .form-group {
        display: flex;
        flexdirection: column;
    }
    label {
        margin-bottom: 6px;
        fontsize: 0.85rem;
        color: #475569;
    }
    input,
    select {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    /* Assignments */
    .assignments-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .btn-small-primary {
        background: #00cfe6;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .assignment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    .asig-info {
        display: flex;
        flex-direction: column;
    }

    .materia {
        font-weight: 600;
        font-size: 0.9rem;
        color: #1e293b;
    }
    .curso {
        font-size: 0.8rem;
        color: #64748b;
    }

    .btn-icon-delete {
        background: transparent;
        border: none;
        color: #ef4444;
        cursor: pointer;
        opacity: 0.7;
    }
    .btn-icon-delete:hover {
        opacity: 1;
    }
    .btn-icon-delete svg {
        width: 16px;
        height: 16px;
    }

    .btn-primary {
        background: #00cfe6;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }
    .btn-outline {
        background: white;
        color: #64748b;
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
    }
    .btn-delete {
        background: #fee2e2;
        color: #ef4444;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }
</style>
