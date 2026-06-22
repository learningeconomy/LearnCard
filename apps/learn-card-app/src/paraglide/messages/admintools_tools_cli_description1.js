/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Cli_Description1Inputs */

const en_admintools_tools_cli_description1 = /** @type {(inputs: Admintools_Tools_Cli_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Interactive terminal for exploring and testing the LearnCard API.`)
};

const es_admintools_tools_cli_description1 = /** @type {(inputs: Admintools_Tools_Cli_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminal interactiva para explorar y probar la API de LearnCard.`)
};

const fr_admintools_tools_cli_description1 = /** @type {(inputs: Admintools_Tools_Cli_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminal interactif pour explorer et tester l'API LearnCard.`)
};

const ar_admintools_tools_cli_description1 = /** @type {(inputs: Admintools_Tools_Cli_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طرفية تفاعلية لاستكشاف واختبار واجهة LearnCard API.`)
};

/**
* | output |
* | --- |
* | "Interactive terminal for exploring and testing the LearnCard API." |
*
* @param {Admintools_Tools_Cli_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_cli_description1 = /** @type {((inputs?: Admintools_Tools_Cli_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Cli_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_cli_description1(inputs)
	if (locale === "es") return es_admintools_tools_cli_description1(inputs)
	if (locale === "fr") return fr_admintools_tools_cli_description1(inputs)
	return ar_admintools_tools_cli_description1(inputs)
});
export { admintools_tools_cli_description1 as "adminTools.tools.cli.description" }