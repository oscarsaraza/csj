import { db } from '$lib/server/db-client';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { descargarDatosSierju } from '$lib/core/estadisticas/descargas-sierju';

export const load = (async ({ params }) => {
	const despacho = await db.despacho.findFirst({ where: { id: params.despachoId } });
	if (!despacho) error(404, 'Despacho no encontrado');

	const tiposDespacho = await db.tipoDespacho.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
	const opcionesTipoDespacho = tiposDespacho.map(({ id, nombre }) => ({ label: nombre, value: id }));

	return { despacho, opcionesTipoDespacho };
}) satisfies PageServerLoad;

export const actions = {
	actualizar: async ({ request, params }) => {
		const formData = Object.fromEntries(await request.formData());

		const schema = z.object({
			numero: z.coerce.number(),
			tipoDespachoId: z.string(),
			municipio: z.string(),
			distrito: z.string(),
		});

		const { success, data } = schema.safeParse(formData);
		if (!success) return { success: false, error: 'Datos no válidos' };

		await db.despacho.update({ where: { id: params.despachoId }, data });

		redirect(302, '/despacho/' + params.despachoId);
	},

	descargarEstadisticas: async ({ params, request }) => {
		const despacho = await db.despacho.findFirst({ where: { id: params.despachoId }, select: { codigo: true } });
		if (!despacho) error(404, 'Despacho no encontrado');

		const data = await request.formData();
		const periodo = parseInt(data.get('periodo')?.toString() ?? '0');

		if (!periodo) return error(400, 'Se debe especificar el periodo (año) a descargar.');

		 const descargaEnProgreso = await db.periodoEstadisticasSierju.findFirst({ where: { despachoId: params.despachoId, periodo } });
		 if (descargaEnProgreso) return error(400, 'Ya hay una descarga en progreso para el periodo y despacho especificados.');

		try {
			descargarDatosSierju(periodo, [despacho.codigo]);
		} catch (err) {
			error(500, 'Error al descargar la información estadística desde SIERJU.');
		}

		redirect(302, '/despacho/' + params.despachoId);
	},
};
