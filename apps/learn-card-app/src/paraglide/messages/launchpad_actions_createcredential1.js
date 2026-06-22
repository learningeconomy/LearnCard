/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createcredential1Inputs */

const en_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Credential`)
};

const es_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear credencial`)
};

const fr_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une accréditation`)
};

const ar_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "Create Credential" |
*
* @param {Launchpad_Actions_Createcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createcredential1 = /** @type {((inputs?: Launchpad_Actions_Createcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createcredential1(inputs)
	if (locale === "es") return es_launchpad_actions_createcredential1(inputs)
	if (locale === "fr") return fr_launchpad_actions_createcredential1(inputs)
	return ar_launchpad_actions_createcredential1(inputs)
});
export { launchpad_actions_createcredential1 as "launchpad.actions.createCredential" }