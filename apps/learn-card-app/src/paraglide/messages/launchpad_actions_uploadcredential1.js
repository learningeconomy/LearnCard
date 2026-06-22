/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Uploadcredential1Inputs */

const en_launchpad_actions_uploadcredential1 = /** @type {(inputs: Launchpad_Actions_Uploadcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Credential`)
};

const es_launchpad_actions_uploadcredential1 = /** @type {(inputs: Launchpad_Actions_Uploadcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir credencial`)
};

const fr_launchpad_actions_uploadcredential1 = /** @type {(inputs: Launchpad_Actions_Uploadcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléverser un justificatif`)
};

const ar_launchpad_actions_uploadcredential1 = /** @type {(inputs: Launchpad_Actions_Uploadcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "Upload Credential" |
*
* @param {Launchpad_Actions_Uploadcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_uploadcredential1 = /** @type {((inputs?: Launchpad_Actions_Uploadcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Uploadcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_uploadcredential1(inputs)
	if (locale === "es") return es_launchpad_actions_uploadcredential1(inputs)
	if (locale === "fr") return fr_launchpad_actions_uploadcredential1(inputs)
	return ar_launchpad_actions_uploadcredential1(inputs)
});
export { launchpad_actions_uploadcredential1 as "launchpad.actions.uploadCredential" }