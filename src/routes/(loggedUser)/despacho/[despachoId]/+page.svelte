<script lang="ts">
	import PageLayout from '$lib/components/custom/page-layout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';

	export let data: PageData;
	const { despacho, opcionesTipoDespacho } = data;
</script>

<PageLayout username={data.user}>
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold">{despacho.nombre} - {despacho.codigo}</h1>

		<form method="post" class="max-w-xs" action="?/actualizar">
			<div class="grid items-center gap-2 sm:grid-cols-[1fr_2fr]">
				<Label for="numero">Número</Label>
				<Input type="number" name="numero" value={despacho.numero} required />

				<Label for="tipoDespachoId">Tipo de despacho</Label>
				<Select.Root portal={null} selected={opcionesTipoDespacho.find(({ value }) => value === despacho.tipoDespachoId)}>
					<Select.Trigger class="w-full">
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each opcionesTipoDespacho as op}
								<Select.Item value={op.value} label={op.label}>{op.label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
					<Select.Input name="tipoDespachoId" required />
				</Select.Root>

				<Label for="municipio">Municipio</Label>
				<Input type="text" name="municipio" value={despacho.municipio} required />

				<Label for="distrito">Distrito</Label>
				<Input type="text" name="distrito" value={despacho.distrito} />

				<Button type="submit">Guardar</Button>
			</div>
		</form>

		<form method="post" action="?/descargarEstadisticas">
			<Button type="submit">Descargar estadísticas SIERJU</Button>
		</form>
	</div>
</PageLayout>
