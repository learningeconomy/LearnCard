/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devdocs_Description2Inputs */

const en_admintools_devdocs_description2 = /** @type {(inputs: Admintools_Devdocs_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check out the LearnCard developer docs to learn how to build and integrate with our SDKs and APIs.`)
};

const es_admintools_devdocs_description2 = /** @type {(inputs: Admintools_Devdocs_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consulta la documentación para desarrolladores de LearnCard para aprender a crear e integrar con nuestros SDK y API.`)
};

const fr_admintools_devdocs_description2 = /** @type {(inputs: Admintools_Devdocs_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultez la documentation pour développeurs de LearnCard pour apprendre à créer et à intégrer nos SDK et API.`)
};

const ar_admintools_devdocs_description2 = /** @type {(inputs: Admintools_Devdocs_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطّلع على وثائق مطوّري LearnCard لتتعلّم كيفية البناء والتكامل مع حِزم SDK وواجهات API الخاصة بنا.`)
};

/**
* | output |
* | --- |
* | "Check out the LearnCard developer docs to learn how to build and integrate with our SDKs and APIs." |
*
* @param {Admintools_Devdocs_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devdocs_description2 = /** @type {((inputs?: Admintools_Devdocs_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devdocs_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devdocs_description2(inputs)
	if (locale === "es") return es_admintools_devdocs_description2(inputs)
	if (locale === "fr") return fr_admintools_devdocs_description2(inputs)
	return ar_admintools_devdocs_description2(inputs)
});
export { admintools_devdocs_description2 as "adminTools.devDocs.description" }