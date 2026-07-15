/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allconnencrypted3Inputs */

const en_consentflow_allconnencrypted3 = /** @type {(inputs: Consentflow_Allconnencrypted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All connections are encrypted.`)
};

const es_consentflow_allconnencrypted3 = /** @type {(inputs: Consentflow_Allconnencrypted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las conexiones están cifradas.`)
};

const fr_consentflow_allconnencrypted3 = /** @type {(inputs: Consentflow_Allconnencrypted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les connexions sont chiffrées.`)
};

const ar_consentflow_allconnencrypted3 = /** @type {(inputs: Consentflow_Allconnencrypted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All connections are encrypted.`)
};

/**
* | output |
* | --- |
* | "All connections are encrypted." |
*
* @param {Consentflow_Allconnencrypted3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allconnencrypted3 = /** @type {((inputs?: Consentflow_Allconnencrypted3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allconnencrypted3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allconnencrypted3(inputs)
	if (locale === "es") return es_consentflow_allconnencrypted3(inputs)
	if (locale === "fr") return fr_consentflow_allconnencrypted3(inputs)
	return ar_consentflow_allconnencrypted3(inputs)
});
export { consentflow_allconnencrypted3 as "consentFlow.allConnEncrypted" }