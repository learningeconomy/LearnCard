/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devdocsdescription3Inputs */

const en_admintools_devdocsdescription3 = /** @type {(inputs: Admintools_Devdocsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check out the LearnCard developer docs to learn how to build and integrate with our SDKs and APIs.`)
};

const es_admintools_devdocsdescription3 = /** @type {(inputs: Admintools_Devdocsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consulta la documentación para desarrolladores de LearnCard para aprender a construir e integrar con nuestros SDKs y APIs.`)
};

const fr_admintools_devdocsdescription3 = /** @type {(inputs: Admintools_Devdocsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultez la documentation développeur LearnCard pour apprendre à construire et intégrer avec nos SDK et API.`)
};

const ar_admintools_devdocsdescription3 = /** @type {(inputs: Admintools_Devdocsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطلع على وثائق مطوري LearnCard لتعلم كيفية البناء والتكامل مع SDKs وAPIs الخاصة بنا.`)
};

/**
* | output |
* | --- |
* | "Check out the LearnCard developer docs to learn how to build and integrate with our SDKs and APIs." |
*
* @param {Admintools_Devdocsdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devdocsdescription3 = /** @type {((inputs?: Admintools_Devdocsdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devdocsdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devdocsdescription3(inputs)
	if (locale === "es") return es_admintools_devdocsdescription3(inputs)
	if (locale === "fr") return fr_admintools_devdocsdescription3(inputs)
	return ar_admintools_devdocsdescription3(inputs)
});
export { admintools_devdocsdescription3 as "adminTools.devDocsDescription" }