/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Switchtosel3Inputs */

const en_consentflow_switchtosel3 = /** @type {(inputs: Consentflow_Switchtosel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch to Selective Sharing?`)
};

const es_consentflow_switchtosel3 = /** @type {(inputs: Consentflow_Switchtosel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cambiar a Uso Selectivo?`)
};

const fr_consentflow_switchtosel3 = /** @type {(inputs: Consentflow_Switchtosel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer au partage sélectif ?`)
};

const ar_consentflow_switchtosel3 = /** @type {(inputs: Consentflow_Switchtosel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch to Selective Sharing?`)
};

/**
* | output |
* | --- |
* | "Switch to Selective Sharing?" |
*
* @param {Consentflow_Switchtosel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_switchtosel3 = /** @type {((inputs?: Consentflow_Switchtosel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Switchtosel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_switchtosel3(inputs)
	if (locale === "es") return es_consentflow_switchtosel3(inputs)
	if (locale === "fr") return fr_consentflow_switchtosel3(inputs)
	return ar_consentflow_switchtosel3(inputs)
});
export { consentflow_switchtosel3 as "consentFlow.switchToSel" }