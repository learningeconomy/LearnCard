/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Networks_Description1Inputs */

const en_admintools_tools_networks_description1 = /** @type {(inputs: Admintools_Tools_Networks_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select your preferred network environment.`)
};

const es_admintools_tools_networks_description1 = /** @type {(inputs: Admintools_Tools_Networks_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona tu entorno de red preferido.`)
};

const fr_admintools_tools_networks_description1 = /** @type {(inputs: Admintools_Tools_Networks_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez votre environnement réseau préféré.`)
};

const ar_admintools_tools_networks_description1 = /** @type {(inputs: Admintools_Tools_Networks_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر بيئة الشبكة المفضّلة لديك.`)
};

/**
* | output |
* | --- |
* | "Select your preferred network environment." |
*
* @param {Admintools_Tools_Networks_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_networks_description1 = /** @type {((inputs?: Admintools_Tools_Networks_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Networks_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_networks_description1(inputs)
	if (locale === "es") return es_admintools_tools_networks_description1(inputs)
	if (locale === "fr") return fr_admintools_tools_networks_description1(inputs)
	return ar_admintools_tools_networks_description1(inputs)
});
export { admintools_tools_networks_description1 as "adminTools.tools.networks.description" }