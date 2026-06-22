/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Learnercontexttest_Description3Inputs */

const en_admintools_tools_learnercontexttest_description3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pick wallet credentials, choose a backend URL, and inspect formatter output.`)
};

const es_admintools_tools_learnercontexttest_description3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona credenciales de la cartera, elige una URL de backend e inspecciona la salida del formateador.`)
};

const fr_admintools_tools_learnercontexttest_description3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez des justificatifs du portefeuille, choisissez une URL de backend et inspectez la sortie du formateur.`)
};

const ar_admintools_tools_learnercontexttest_description3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر بيانات اعتماد من المحفظة، وحدّد عنوان URL للخادم، وافحص مخرجات المُنسّق.`)
};

/**
* | output |
* | --- |
* | "Pick wallet credentials, choose a backend URL, and inspect formatter output." |
*
* @param {Admintools_Tools_Learnercontexttest_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_learnercontexttest_description3 = /** @type {((inputs?: Admintools_Tools_Learnercontexttest_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Learnercontexttest_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_learnercontexttest_description3(inputs)
	if (locale === "es") return es_admintools_tools_learnercontexttest_description3(inputs)
	if (locale === "fr") return fr_admintools_tools_learnercontexttest_description3(inputs)
	return ar_admintools_tools_learnercontexttest_description3(inputs)
});
export { admintools_tools_learnercontexttest_description3 as "adminTools.tools.learnerContextTest.description" }