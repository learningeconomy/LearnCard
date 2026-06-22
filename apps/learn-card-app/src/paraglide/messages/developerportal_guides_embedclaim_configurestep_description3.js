/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs */

const en_developerportal_guides_embedclaim_configurestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your credential templates and customize branding for the claim experience. Templates persist as reusable credentials that you can reference by URI.`)
};

const es_developerportal_guides_embedclaim_configurestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tus plantillas de credenciales y personaliza la marca para la experiencia de reclamo. Las plantillas persisten como credenciales reutilizables que puedes referenciar por URI.`)
};

const fr_developerportal_guides_embedclaim_configurestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez vos modèles de certificats et personnalisez l'identité visuelle pour l'expérience de réclamation. Les modèles persistent comme certificats réutilisables que vous pouvez référencer par URI.`)
};

const ar_developerportal_guides_embedclaim_configurestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ قوالب المؤهلات الخاصة بك وخصص العلامة التجارية لتجربة المطالبة. القوالب تستمر كمؤهلات قابلة لإعادة الاستخدام يمكنك الرجوع إليها عبر URI.`)
};

/**
* | output |
* | --- |
* | "Create your credential templates and customize branding for the claim experience. Templates persist as reusable credentials that you can reference by URI." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_description3 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_description3(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_description3(inputs)
});
export { developerportal_guides_embedclaim_configurestep_description3 as "developerPortal.guides.embedClaim.configureStep.description" }