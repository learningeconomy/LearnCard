/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sharelink_Description22Inputs */

const en_passport_resumebuilder_sharelink_description22 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share with recruiters, hiring managers, friends, or anyone you want to review your resume.`)
};

const es_passport_resumebuilder_sharelink_description22 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compártelo con reclutadores, responsables de contratación, amigos o cualquier persona que quieras que revise tu currículum.`)
};

const fr_passport_resumebuilder_sharelink_description22 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez-le avec des recruteurs, des responsables du recrutement, des amis ou toute personne à qui vous souhaitez faire consulter votre CV.`)
};

const ar_passport_resumebuilder_sharelink_description22 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شاركها مع جهات التوظيف ومديري التوظيف والأصدقاء أو أي شخص تريد أن يطّلع على سيرتك الذاتية.`)
};

/**
* | output |
* | --- |
* | "Share with recruiters, hiring managers, friends, or anyone you want to review your resume." |
*
* @param {Passport_Resumebuilder_Sharelink_Description22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_description22 = /** @type {((inputs?: Passport_Resumebuilder_Sharelink_Description22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Description22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_description22(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_description22(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_description22(inputs)
	return ar_passport_resumebuilder_sharelink_description22(inputs)
});
export { passport_resumebuilder_sharelink_description22 as "passport.resumeBuilder.shareLink.description2" }