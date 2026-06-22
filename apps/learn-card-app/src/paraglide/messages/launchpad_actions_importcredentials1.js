/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Importcredentials1Inputs */

const en_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credentials`)
};

const es_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar credenciales`)
};

const fr_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer des accréditations`)
};

const ar_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Import Credentials" |
*
* @param {Launchpad_Actions_Importcredentials1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_importcredentials1 = /** @type {((inputs?: Launchpad_Actions_Importcredentials1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Importcredentials1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_importcredentials1(inputs)
	if (locale === "es") return es_launchpad_actions_importcredentials1(inputs)
	if (locale === "fr") return fr_launchpad_actions_importcredentials1(inputs)
	return ar_launchpad_actions_importcredentials1(inputs)
});
export { launchpad_actions_importcredentials1 as "launchpad.actions.importCredentials" }