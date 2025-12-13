<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import Toast from "$lib/components/Toast.svelte";
    import {
        profesoresService,
        type Profesor,
    } from "$lib/services/profesores.js";
    import { administrativosService } from "$lib/services/administrativos.js"; // For cargos

    const dispatch = createEventDispatcher<{
        save: Profesor;
        cancel: void;
    }>();

    let profesor: any = {
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

    let formErrors = {
        ci: false,
        nombres: false,
        apellido_paterno: false,
        correo: false,
        id_cargo: false,
    };

    let errorMessages = {
        ci: "",
        nombres: "",
        apellido_paterno: "",
        correo: "",
        id_cargo: "",
    };

    let cargos: any[] = [];
    let cargandoCargos = false;
    let guardando = false;
    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";

    onMount(async () => {
        await cargarCargos();
    });

    async function cargarCargos() {
        cargandoCargos = true;
        try {
            cargos = await administrativosService.getCargos();
        } catch (error: any) {
            console.error("Error cargando cargos:", error);
        } finally {
            cargandoCargos = false;
        }
    }

    function validarCampo(campo: string, valor: any) {
        switch (campo) {
            case "ci":
                if (!valor || valor.trim() === "") {
                    formErrors.ci = true;
                    errorMessages.ci = "El CI es obligatorio";
                } else if (valor.trim().length < 5) {
                    formErrors.ci = true;
                    errorMessages.ci = "El CI debe tener al menos 5 caracteres";
                } else {
                    formErrors.ci = false;
                    errorMessages.ci = "";
                }
                break;
            case "nombres":
                if (!valor || valor.trim() === "") {
                    formErrors.nombres = true;
                    errorMessages.nombres = "Los nombres son obligatorios";
                } else {
                    formErrors.nombres = false;
                    errorMessages.nombres = "";
                }
                break;
            case "apellido_paterno":
                if (!valor || valor.trim() === "") {
                    formErrors.apellido_paterno = true;
                    errorMessages.apellido_paterno =
                        "El apellido paterno es obligatorio";
                } else {
                    formErrors.apellido_paterno = false;
                    errorMessages.apellido_paterno = "";
                }
                break;
            case "correo":
                if (valor && valor.trim() !== "") {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(valor.trim())) {
                        formErrors.correo = true;
                        errorMessages.correo =
                            "El correo electrónico no es válido";
                    } else {
                        formErrors.correo = false;
                        errorMessages.correo = "";
                    }
                } else {
                    formErrors.correo = false;
                    errorMessages.correo = "";
                }
                break;
        }
    }

    function validarForm() {
        let isValid = true;
        formErrors = {
            ci: false,
            nombres: false,
            apellido_paterno: false,
            correo: false,
            id_cargo: false,
        };

        if (!profesor.ci || profesor.ci.trim() === "") {
            validarCampo("ci", profesor.ci);
            isValid = false;
        }
        if (!profesor.nombres || profesor.nombres.trim() === "") {
            validarCampo("nombres", profesor.nombres);
            isValid = false;
        }
        if (
            !profesor.apellido_paterno ||
            profesor.apellido_paterno.trim() === ""
        ) {
            validarCampo("apellido_paterno", profesor.apellido_paterno);
            isValid = false;
        }
        if (profesor.correo && !profesor.correo.includes("@")) {
            validarCampo("correo", profesor.correo);
            isValid = false;
        }

        return isValid;
    }

    async function guardar() {
        if (!validarForm()) {
            toastMessage =
                "Por favor, complete todos los campos requeridos correctamente";
            toastType = "error";
            return;
        }

        guardando = true;

        try {
            const data = {
                ci: profesor.ci.trim(),
                nombres: profesor.nombres.trim(),
                apellido_paterno: profesor.apellido_paterno.trim(),
                apellido_materno: profesor.apellido_materno?.trim() || null,
                direccion: profesor.direccion?.trim() || null,
                telefono: profesor.telefono?.trim() || null,
                correo: profesor.correo?.trim() || null,
                id_cargo: profesor.id_cargo ? Number(profesor.id_cargo) : null,
                estado_laboral: profesor.estado_laboral || "activo",
                anos_experiencia: Number(profesor.anos_experiencia) || 0,
                fecha_ingreso: profesor.fecha_ingreso || null,

                // Profesor specific
                especialidad: profesor.especialidad?.trim() || null,
                titulo_academico: profesor.titulo_academico?.trim() || null,
                nivel_enseñanza: profesor.nivel_enseñanza || "todos",
                observaciones: profesor.observaciones?.trim() || null,
            };

            const saved = await profesoresService.createProfesor(data);

            toastMessage = "Profesor registrado exitosamente";
            toastType = "success";
            setTimeout(() => {
                dispatch("save", saved);
                resetForm();
            }, 1000);
        } catch (error: any) {
            console.error("Error:", error);
            let errorMsg = "Error al registrar profesor";
            if (error.details?.detail) errorMsg = error.details.detail;
            else if (error.message) errorMsg = error.message;

            toastMessage = errorMsg;
            toastType = "error";
        } finally {
            guardando = false;
        }
    }

    function cancelar() {
        resetForm();
        dispatch("cancel");
    }

    function resetForm() {
        profesor = {
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
    }
</script>

<div class="nuevo-profesor-container">
    <div class="nuevo-profesor">
        <div class="header">
            <div class="icon-title">
                <div class="icon">👨‍🏫</div>
                <div>
                    <h2>Nuevo Profesor</h2>
                    <p>Complete los datos del personal docente</p>
                </div>
            </div>
            <div class="actions">
                <button
                    class="btn-outline"
                    on:click={cancelar}
                    disabled={guardando}>Cancelar</button
                >
                <button
                    class="btn-primary"
                    on:click={guardar}
                    disabled={guardando}
                >
                    {#if guardando}
                        <span class="spinner"></span> Guardando...
                    {:else}
                        Guardar
                    {/if}
                </button>
            </div>
        </div>

        <div class="form">
            <!-- Información Personal -->
            <section>
                <h3>Información Personal</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.ci}>CI *</label>
                        <input
                            type="text"
                            bind:value={profesor.ci}
                            on:input={() => validarCampo("ci", profesor.ci)}
                            on:blur={() => validarCampo("ci", profesor.ci)}
                            placeholder="Ej: 1234567"
                            class:error={formErrors.ci}
                            disabled={guardando}
                        />
                        {#if formErrors.ci}
                            <span class="error-message">{errorMessages.ci}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Estado Laboral</label>
                        <select
                            bind:value={profesor.estado_laboral}
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
                        <label class:error={formErrors.nombres}>Nombres *</label
                        >
                        <input
                            type="text"
                            bind:value={profesor.nombres}
                            on:input={() =>
                                validarCampo("nombres", profesor.nombres)}
                            on:blur={() =>
                                validarCampo("nombres", profesor.nombres)}
                            placeholder="Ej: Juan Carlos"
                            class:error={formErrors.nombres}
                            disabled={guardando}
                        />
                        {#if formErrors.nombres}
                            <span class="error-message"
                                >{errorMessages.nombres}</span
                            >
                        {/if}
                    </div>
                </div>

                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.apellido_paterno}
                            >Apellido Paterno *</label
                        >
                        <input
                            type="text"
                            bind:value={profesor.apellido_paterno}
                            on:input={() =>
                                validarCampo(
                                    "apellido_paterno",
                                    profesor.apellido_paterno,
                                )}
                            on:blur={() =>
                                validarCampo(
                                    "apellido_paterno",
                                    profesor.apellido_paterno,
                                )}
                            placeholder="Ej: Pérez"
                            class:error={formErrors.apellido_paterno}
                            disabled={guardando}
                        />
                        {#if formErrors.apellido_paterno}
                            <span class="error-message"
                                >{errorMessages.apellido_paterno}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Apellido Materno</label>
                        <input
                            type="text"
                            bind:value={profesor.apellido_materno}
                            placeholder="Ej: García"
                            disabled={guardando}
                        />
                    </div>
                </div>
            </section>

            <!-- Información de Contacto -->
            <section>
                <h3>Información de Contacto</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.correo}
                            >Correo Electrónico</label
                        >
                        <input
                            type="email"
                            bind:value={profesor.correo}
                            on:input={() =>
                                validarCampo("correo", profesor.correo)}
                            on:blur={() =>
                                validarCampo("correo", profesor.correo)}
                            placeholder="profesor@escuela.edu"
                            class:error={formErrors.correo}
                            disabled={guardando}
                        />
                        {#if formErrors.correo}
                            <span class="error-message"
                                >{errorMessages.correo}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input
                            type="tel"
                            bind:value={profesor.telefono}
                            placeholder="+591 789-0000"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Dirección</label>
                        <input
                            type="text"
                            bind:value={profesor.direccion}
                            placeholder=""
                            disabled={guardando}
                        />
                    </div>
                </div>
            </section>

            <!-- Información Académica -->
            <section>
                <h3>Información Académica</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Especialidad</label>
                        <input
                            type="text"
                            bind:value={profesor.especialidad}
                            placeholder="Ej: Matemáticas"
                            disabled={guardando}
                        />
                    </div>
                    <div class="form-group">
                        <label>Título Académico</label>
                        <input
                            type="text"
                            bind:value={profesor.titulo_academico}
                            placeholder="Ej: Licenciado en Educación"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Nivel de Enseñanza</label>
                        <select
                            bind:value={profesor.nivel_enseñanza}
                            disabled={guardando}
                        >
                            <option value="todos">Todos</option>
                            <option value="foundation">Inicial</option>
                            <option value="primary">Primaria</option>
                            <option value="secondary">Secundaria</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Años de Experiencia</label>
                        <input
                            type="number"
                            bind:value={profesor.anos_experiencia}
                            min="0"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Fecha de Ingreso</label>
                        <input
                            type="date"
                            bind:value={profesor.fecha_ingreso}
                            disabled={guardando}
                        />
                    </div>
                    <div class="form-group">
                        <label>Cargo (Opcional)</label>
                        <select
                            bind:value={profesor.id_cargo}
                            disabled={guardando || cargandoCargos}
                        >
                            <option value={null}>Seleccione un cargo...</option>
                            {#each cargos as cargo}
                                <option value={cargo.id_cargo}
                                    >{cargo.nombre_cargo}</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Observaciones</label>
                        <textarea
                            bind:value={profesor.observaciones}
                            placeholder="Observaciones adicionales..."
                            rows="3"
                            disabled={guardando}
                        ></textarea>
                    </div>
                </div>
            </section>
        </div>
    </div>
</div>

<Toast message={toastMessage} type={toastType} />

<style>
    .nuevo-profesor-container {
        background: #f8fafc;
        padding: 20px;
    }

    .nuevo-profesor {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        max-width: 900px;
        margin: 0 auto;
        min-height: fit-content;
    }

    .form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 12px;
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
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

    h2 + p {
        margin: 2px 0 0;
        color: #64748b;
        font-size: 0.85rem;
    }

    .actions {
        display: flex;
        gap: 12px;
    }

    .btn-outline,
    .btn-primary {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        border: none;
        font-weight: 500;
        transition: all 0.2s;
    }

    .btn-outline {
        background: #fff;
        color: #64748b;
        border: 1.5px solid #e2e8f0;
    }

    .btn-outline:hover:not(:disabled) {
        background: #f8fafc;
    }

    .btn-primary {
        background: #00cfe6;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .btn-primary:hover:not(:disabled) {
        background: #00b8d4;
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    section {
        background: #fafbfc;
        padding: 18px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    section h3 {
        margin: 0 0 16px;
        font-size: 0.95rem;
        color: #1e293b;
        font-weight: 600;
    }

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
        flex-direction: column;
    }

    label {
        margin-bottom: 6px;
        font-size: 0.85rem;
        color: #475569;
        font-weight: 500;
    }

    label.error {
        color: #ef4444;
    }

    input,
    select,
    textarea {
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #1e293b;
    }

    input:focus,
    select:focus,
    textarea:focus {
        outline: none;
        border-color: #00cfe6;
    }

    input.error,
    select.error {
        border-color: #ef4444;
    }

    .error-message {
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 4px;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
