/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Addingmethod1Inputs */

const en_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding another method improves your security.`)
};

const es_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar otro método mejora tu seguridad.`)
};

const fr_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une autre méthode améliore votre sécurité.`)
};

const ar_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة طريقة أخرى يعزز أمانك.`)
};

/**
* | output |
* | --- |
* | "Adding another method improves your security." |
*
* @param {Recovery_Addingmethod1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_addingmethod1 = /** @type {((inputs?: Recovery_Addingmethod1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Addingmethod1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_addingmethod1(inputs)
	if (locale === "es") return es_recovery_addingmethod1(inputs)
	if (locale === "fr") return fr_recovery_addingmethod1(inputs)
	return ar_recovery_addingmethod1(inputs)
});
export { recovery_addingmethod1 as "recovery.addingMethod" }