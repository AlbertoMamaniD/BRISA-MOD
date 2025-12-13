<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { text } from '@sveltejs/kit';
	import {
		profesoresService,
		type Profesor
	} from '$lib/services/profesores.js';
	import { administrativosService, type Cargo } from '$lib/services/administrativos.js'; // Reusing for cargos if needed
	import { getIconSvg } from '$lib/components/svg.js';
	import CreateProfesor from './CreateProfesor.svelte';
	import EditarProfesor from './EditarProfesor.svelte';
	import DetallesProfesor from './DetallesProfesor.svelte';

	const POLLING_INTERVAL = 5000;
	const FAST_POLLING_INTERVAL = 2000;

	// ==================== ESTADO ====================
	let profesores: Profesor[] = [];
	let cargos: Cargo[] = []; // If professors use same cargos table
	let cargoSeleccionado = 'todos';
	let estadoSeleccionado = 'todos';
	let searchQuery = '';
	let mostrarNuevo = false;
	let mostrarEditar = false;
	let mostrarDetalles = false;
	let profesorSeleccionado: Profesor | null = null;
	let isLoading = false;
	let hasChanges = false;
	let polling: number | null = null;
	let errorCargando: string | null = null;
	let timeoutCarga: number | null = null;

	// ==================== UTILIDADES ====================
	function hash(data: any) {
		return JSON.stringify(data)
			.split('')
			.reduce((a, b) => (a = (a << 5) - a + b.charCodeAt(0)) & a, 0)
			.toString();
	}

	function initials(p: Profesor) {
		const ap = p.apellido_paterno?.[0] || p.apellido_materno?.[0] || '';
		const n = p.nombres.split(' ')[0]?.[0] || '';
		return (ap + n).toUpperCase() || '?';
	}

	function fullName(p: Profesor) {
		const ape = p.apellido_paterno || p.apellido_materno || '';
		return `${ape} ${p.nombres}`.trim() || 'Sin nombre';
	}

	// ==================== CARGA DATOS ====================
	let lastHash = '';

	async function cargarProfesores(silent = false) {
		if (!silent) {
			isLoading = true;
			errorCargando = null;
			if (timeoutCarga) clearTimeout(timeoutCarga);
			timeoutCarga = setTimeout(() => {
				if (isLoading) {
					errorCargando = 'No se ha podido cargar los profesores';
					isLoading = false;
				}
			}, 10000) as any;
		}
		try {
			const data = await profesoresService.getProfesores();
			const newHash = hash(data);

			if (newHash !== lastHash) {
				lastHash = newHash;
				profesores = data;
				hasChanges = true;
			}
			errorCargando = null;
		} catch (err: any) {
			if (!silent) {
				errorCargando = 'No se ha podido cargar los profesores';
				isLoading = false;
			}
		} finally {
			if (!silent) {
				if (timeoutCarga) {
					clearTimeout(timeoutCarga);
					timeoutCarga = null;
				}
				isLoading = false;
			}
			setTimeout(() => (hasChanges = false), 1000);
		}
	}

	function reintentarCarga() {
		errorCargando = null;
		cargarProfesores();
	}

	async function cargarCargos() {
		try {
			cargos = await administrativosService.getCargos();
		} catch {}
	}

	async function refrescar(silent = false) {
		await Promise.all([cargarProfesores(silent), cargarCargos()]);
	}

	function pollingStart(interval = POLLING_INTERVAL) {
		pollingStop();
		polling = setInterval(() => refrescar(true), interval) as any;
	}

	function pollingStop() {
		if (polling) clearInterval(polling);
		polling = null;
	}

	function pollingRapido() {
		pollingStop();
		pollingStart(FAST_POLLING_INTERVAL);
		setTimeout(() => pollingStart(POLLING_INTERVAL), 10000);
	}

	onMount(() => {
		refrescar();
		pollingStart();
		const vis = () => !document.hidden && refrescar(true);
		document.addEventListener('visibilitychange', vis);
		onDestroy(() => {
			pollingStop();
			document.removeEventListener('visibilitychange', vis);
		});
	});

	// ==================== ACCIONES ====================
	function abrirNuevo() {
		mostrarNuevo = true;
		mostrarEditar = false;
		mostrarDetalles = false;
	}

	function abrirEditar(p: Profesor, e: Event) {
		e.stopPropagation(); // Prevent opening details
		profesorSeleccionado = p;
		mostrarEditar = true;
		mostrarNuevo = false;
		mostrarDetalles = false;
	}

	function abrirDetalles(p: Profesor) {
		profesorSeleccionado = p;
		mostrarDetalles = true;
		mostrarNuevo = false;
		mostrarEditar = false;
	}

	function cerrarForms() {
		mostrarNuevo = false;
		mostrarEditar = false;
		mostrarDetalles = false;
		profesorSeleccionado = null;
	}

	async function onSave(e: CustomEvent<Profesor>) {
		const saved = e.detail;
		const idx = profesores.findIndex(
			(p) => (p.id_profesor) === (saved.id_profesor)
		);
		if (idx >= 0) profesores[idx] = saved;
		else profesores = [...profesores, saved];
		profesores = profesores;
		cerrarForms();
		await refrescar(true);
		pollingRapido();
	}

	function onDelete(e: CustomEvent<{ id: number }>) {
		// id returned matches id_profesor usually? Or maybe service return void.
		// We'll trust refrescar() to clean up, but optimistic update ok too
		profesores = profesores.filter((p) => p.id_profesor !== e.detail.id); // Assuming e.detail.id is id_profesor
		cerrarForms();
		refrescar(true);
	}

	// ==================== HELPER CARGO ====================
	function getCargoName(id?: number) {
		if (!id) return '';
		const c = cargos.find(x => x.id_cargo === id);
		return c ? c.nombre_cargo : '';
	}

	// ==================== FILTROS ====================
	$: filtrados = profesores.filter((p) => {
		const q = searchQuery.toLowerCase();
		const okNombre =
			p.nombres?.toLowerCase().includes(q) ||
			p.apellido_paterno?.toLowerCase().includes(q) ||
			fullName(p).toLowerCase().includes(q);
		const okCI = p.ci?.toLowerCase().includes(q) ?? false;
		const okEsp = p.especialidad?.toLowerCase().includes(q) ?? false;
		
		const okEstadoSelect =
			estadoSeleccionado === 'todos' ||
			p.estado_laboral?.toLowerCase() === estadoSeleccionado.toLowerCase();

		return (okNombre || okCI || okEsp) && okEstadoSelect;
	});
</script>

{#if mostrarNuevo}
	<CreateProfesor on:save={onSave} on:cancel={cerrarForms} />
{:else if mostrarEditar && profesorSeleccionado}
	<EditarProfesor
		profesor={profesorSeleccionado}
		on:save={onSave}
		on:cancel={cerrarForms}
		on:delete={onDelete}
	/>
{:else if mostrarDetalles && profesorSeleccionado}
	<DetallesProfesor 
		profesor={profesorSeleccionado}
		on:cancel={cerrarForms}
		on:edit={() => {
			mostrarDetalles = false;
			mostrarEditar = true;
		}}
	/>
{:else}
	<div class="profesores-container panel">
		<!-- TÍTULO -->
		<div class="title-section">
			<h1>Profesores</h1>
			<p>Gestiona la información del personal docente</p>
		</div>

		<!-- BOTÓN A LA DERECHA (DEBAJO DEL TÍTULO) -->
		<div class="button-row">
			<button class="btn-nuevo" on:click={abrirNuevo}>+ Nuevo Profesor</button>
		</div>

		<!-- FILTROS -->
		<div class="filters">
			<input
				type="text"
				placeholder="Buscar por nombre, CI, especialidad..."
				bind:value={searchQuery}
			/>
			<div class="filter-group">
				<select bind:value={estadoSeleccionado}>
					<option value="todos">Todos los estados</option>
					<option value="activo">Activo</option>
					<option value="inactivo">Inactivo</option>
					<option value="retirado">Retirado</option>
					<option value="suspendido">Suspendido</option>
				</select>
			</div>
		</div>

		<!-- GRID DE PROFESORES -->
		<div class="grid-container">
			{#if isLoading && profesores.length === 0}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Cargando profesores...</p>
				</div>
			{:else if errorCargando && profesores.length === 0}
				<div class="error-state">
					{@html getIconSvg('alert-circle')}
					<p>{errorCargando}</p>
					<button class="btn-reintentar" on:click={reintentarCarga}>
						{@html getIconSvg('refresh-cw')}
						Reintentar
					</button>
				</div>
			{:else if filtrados.length === 0}
				<div class="empty-state">
					<p>No se encontraron profesores.</p>
				</div>
			{:else}
				<div class="grid" class:updating={hasChanges}>
					{#each filtrados as p (p.id_profesor ?? Math.random())}
						<div class="card" on:click={() => abrirDetalles(p)}>
							<div class="avatar-circle">{initials(p)}</div>

							<div class="info">
								<div class="name-line">
									<h3>{fullName(p)}</h3>
									{#if p.especialidad}
										<span class="cargo-pill">{p.especialidad}</span>
									{/if}
								</div>

								<div class="area-row">
									<span class="area-tag">{p.nivel_enseñanza || 'General'}</span>
									<span class="id-tag">CI: {p.ci}</span>
								</div>

								<div class="footer">
									<div class="actions-card">
										<button class="btn-icon-edit" on:click={(e) => abrirEditar(p, e)} title="Editar">
											{@html getIconSvg('edit')}
										</button>
									</div>

									<span
										class="estado {p.estado_laboral?.toLowerCase() === 'activo'
											? 'activo'
											: 'inactivo'}"
									>
										{p.estado_laboral || 'N/A'}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	:root {
		--cyan: #00cfe6;
		--text: #1e293b;
		--muted: #64748b;
	}

	/* ==================== TÍTULO ==================== */
	.title-section {
		margin-bottom: 8px;
	}

	.title-section h1 {
		font-size: 1.8rem;
		color: var(--text);
		margin: 0 0 6px;
	}

	.title-section p {
		color: black;
		margin: 0;
	}

	/* ==================== BOTÓN A LA DERECHA ==================== */
	.button-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 24px;
	}

	.btn-nuevo {
		background: var(--cyan);
		color: white;
		border: none;
		padding: 10px 22px;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: 0.2s ease;
		box-shadow: 0 4px 10px rgba(0, 207, 230, 0.3);
	}

	.btn-nuevo:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 18px rgba(0, 207, 230, 0.4);
	}

	/* ==================== FILTROS ==================== */
	.filters {
		display: flex;
		gap: 16px;
		margin-bottom: 28px;
		align-items: center;
		flex-wrap: wrap;
	}

	.filters input {
		flex: 1;
		min-width: 280px;
		padding: 12px 18px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: white;
		font-size: 0.95rem;
		color: black;
	}

	.filters input:focus {
		outline: none;
		border-color: var(--cyan);
	}

	.filter-group {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.filter-group select {
		padding: 12px 18px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: white;
		font-size: 0.95rem;
		cursor: pointer;
		color: black;
	}

	.filter-group select:focus {
		outline: none;
		border-color: var(--cyan);
	}

	/* ==================== GRID CONTAINER ==================== */
	.grid-container {
		min-height: 200px;
	}

	/* ==================== LOADING STATE ==================== */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		gap: 16px;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid var(--cyan);
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

	.loading-state p {
		color: var(--muted);
		font-size: 0.95rem;
		margin: 0;
	}

	/* ==================== ERROR STATE ==================== */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		gap: 16px;
	}

	.error-state svg {
		width: 48px;
		height: 48px;
		color: #ef4444;
	}

	.error-state p {
		color: #ef4444;
		font-size: 0.95rem;
		margin: 0;
		text-align: center;
	}

	.btn-reintentar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--cyan);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-reintentar:hover {
		background: #00b8d4;
		transform: translateY(-1px);
	}

	.btn-reintentar svg {
		width: 16px;
		height: 16px;
	}

	/* ==================== EMPTY STATE ==================== */
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}

	.empty-state p {
		color: var(--muted);
		font-size: 1rem;
		margin: 0;
	}

	/* ==================== GRID ==================== */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		transition: opacity 0.3s;
	}

	.grid.updating {
		opacity: 0.6;
	}

	/* ==================== CARD ==================== */
	.card {
		background: white;
		border-radius: 16px;
		padding: 16px;
		box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06);
		border: 1px solid #f1f5f9;
		display: flex;
		gap: 16px;
		cursor: pointer;
		transition: 0.25s;
		position: relative;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
	}

	.avatar-circle {
		width: 52px;
		height: 52px;
		background: #9aa9ff;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.info {
		flex: 1;
		min-width: 0;
	}

	.name-line {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.name-line h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cargo-pill {
		background: linear-gradient(135deg, var(--cyan), #00a6b8);
		color: white;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.70rem;
		font-weight: 600;
	}

	.area-row {
		display: flex;
		gap: 6px;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}

	.area-tag {
		background: #f1f5f9;
		padding: 3px 10px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: black;
	}
	
	.id-tag {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 3px 10px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: #64748b;
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}
	
	.actions-card {
		display: flex;
		gap: 4px;
	}
	
	.btn-icon-edit {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f1f5f9;
		border: none;
		border-radius: 6px;
		width: 28px;
		height: 28px;
		cursor: pointer;
		color: #64748b;
		transition: 0.2s;
	}
	
	.btn-icon-edit:hover {
		background: #e2e8f0;
		color: var(--cyan);
	}
	
	.btn-icon-edit svg {
		width: 14px;
		height: 14px;
	}

	.estado {
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.estado.activo {
		background: #ecfdf5;
		color: #16a34a;
	}

	.estado.inactivo {
		background: #fffbeb;
		color: #d97706;
	}

	.panel {
		background: #fff;
		border-radius: 14px;
		padding: 20px;
		box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
		border: 1px solid #eef6fa;
	}
</style>
