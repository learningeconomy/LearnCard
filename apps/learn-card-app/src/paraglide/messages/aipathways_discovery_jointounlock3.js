/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Aipathways_Discovery_Jointounlock3Inputs */

const en_aipathways_discovery_jointounlock3 = /** @type {(inputs: Aipathways_Discovery_Jointounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Join ${i?.brand}
to unlock Pathways`)
};

const es_aipathways_discovery_jointounlock3 = /** @type {(inputs: Aipathways_Discovery_Jointounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Únete a ${i?.brand}
para desbloquear Pathways`)
};

const fr_aipathways_discovery_jointounlock3 = /** @type {(inputs: Aipathways_Discovery_Jointounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rejoignez ${i?.brand}
pour débloquer Pathways`)
};

const ar_aipathways_discovery_jointounlock3 = /** @type {(inputs: Aipathways_Discovery_Jointounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`انضم إلى ${i?.brand}
لفتح المسارات`)
};

/**
* | output |
* | --- |
* | "Join {brand} to unlock Pathways" |
*
* @param {Aipathways_Discovery_Jointounlock3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_jointounlock3 = /** @type {((inputs: Aipathways_Discovery_Jointounlock3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Jointounlock3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_jointounlock3(inputs)
	if (locale === "es") return es_aipathways_discovery_jointounlock3(inputs)
	if (locale === "fr") return fr_aipathways_discovery_jointounlock3(inputs)
	return ar_aipathways_discovery_jointounlock3(inputs)
});
export { aipathways_discovery_jointounlock3 as "aiPathways.discovery.joinToUnlock" }