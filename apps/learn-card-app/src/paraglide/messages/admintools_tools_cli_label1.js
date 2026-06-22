/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Cli_Label1Inputs */

const en_admintools_tools_cli_label1 = /** @type {(inputs: Admintools_Tools_Cli_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer CLI`)
};

const es_admintools_tools_cli_label1 = /** @type {(inputs: Admintools_Tools_Cli_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLI para desarrolladores`)
};

const fr_admintools_tools_cli_label1 = /** @type {(inputs: Admintools_Tools_Cli_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLI pour développeurs`)
};

const ar_admintools_tools_cli_label1 = /** @type {(inputs: Admintools_Tools_Cli_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLI للمطوّرين`)
};

/**
* | output |
* | --- |
* | "Developer CLI" |
*
* @param {Admintools_Tools_Cli_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_cli_label1 = /** @type {((inputs?: Admintools_Tools_Cli_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Cli_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_cli_label1(inputs)
	if (locale === "es") return es_admintools_tools_cli_label1(inputs)
	if (locale === "fr") return fr_admintools_tools_cli_label1(inputs)
	return ar_admintools_tools_cli_label1(inputs)
});
export { admintools_tools_cli_label1 as "adminTools.tools.cli.label" }