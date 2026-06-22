/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Consentflow_Actionlabel3Inputs */

const en_admintools_tools_consentflow_actionlabel3 = /** @type {(inputs: Admintools_Tools_Consentflow_Actionlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Contract`)
};

const es_admintools_tools_consentflow_actionlabel3 = /** @type {(inputs: Admintools_Tools_Consentflow_Actionlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear contrato`)
};

const fr_admintools_tools_consentflow_actionlabel3 = /** @type {(inputs: Admintools_Tools_Consentflow_Actionlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un contrat`)
};

const ar_admintools_tools_consentflow_actionlabel3 = /** @type {(inputs: Admintools_Tools_Consentflow_Actionlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عقد`)
};

/**
* | output |
* | --- |
* | "Create Contract" |
*
* @param {Admintools_Tools_Consentflow_Actionlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_consentflow_actionlabel3 = /** @type {((inputs?: Admintools_Tools_Consentflow_Actionlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Consentflow_Actionlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_consentflow_actionlabel3(inputs)
	if (locale === "es") return es_admintools_tools_consentflow_actionlabel3(inputs)
	if (locale === "fr") return fr_admintools_tools_consentflow_actionlabel3(inputs)
	return ar_admintools_tools_consentflow_actionlabel3(inputs)
});
export { admintools_tools_consentflow_actionlabel3 as "adminTools.tools.consentFlow.actionLabel" }