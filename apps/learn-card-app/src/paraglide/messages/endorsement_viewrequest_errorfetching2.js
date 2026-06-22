/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Endorsement_Viewrequest_Errorfetching2Inputs */

const en_endorsement_viewrequest_errorfetching2 = /** @type {(inputs: Endorsement_Viewrequest_Errorfetching2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error fetching credential: ${i?.error}`)
};

const es_endorsement_viewrequest_errorfetching2 = /** @type {(inputs: Endorsement_Viewrequest_Errorfetching2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al obtener la credencial: ${i?.error}`)
};

const fr_endorsement_viewrequest_errorfetching2 = /** @type {(inputs: Endorsement_Viewrequest_Errorfetching2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erreur lors de la récupération de la credential : ${i?.error}`)
};

const ar_endorsement_viewrequest_errorfetching2 = /** @type {(inputs: Endorsement_Viewrequest_Errorfetching2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`خطأ في جلب الاعتماد: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Error fetching credential: {error}" |
*
* @param {Endorsement_Viewrequest_Errorfetching2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_viewrequest_errorfetching2 = /** @type {((inputs: Endorsement_Viewrequest_Errorfetching2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Viewrequest_Errorfetching2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_viewrequest_errorfetching2(inputs)
	if (locale === "es") return es_endorsement_viewrequest_errorfetching2(inputs)
	if (locale === "fr") return fr_endorsement_viewrequest_errorfetching2(inputs)
	return ar_endorsement_viewrequest_errorfetching2(inputs)
});
export { endorsement_viewrequest_errorfetching2 as "endorsement.viewRequest.errorFetching" }