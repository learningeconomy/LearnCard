/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs */

const en_developerportal_guides_issuecredentials_createtemplatesstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Design your credential templates using the visual builder. Each template becomes a reusable Boost that you can reference by URI when issuing credentials via API.`)
};

const es_developerportal_guides_issuecredentials_createtemplatesstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diseña tus plantillas de credenciales usando el constructor visual. Cada plantilla se convierte en un Boost reutilizable que puedes referenciar por URI al emitir credenciales a través de la API.`)
};

const fr_developerportal_guides_issuecredentials_createtemplatesstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Concevez vos modèles de certificats à l'aide du constructeur visuel. Chaque modèle devient un Boost réutilisable que vous pouvez référencer par URI lors de l'émission de certificats via l'API.`)
};

const ar_developerportal_guides_issuecredentials_createtemplatesstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صمم قوالب المؤهلات الخاصة بك باستخدام المنشئ المرئي. كل قالب يصبح Boost قابلاً لإعادة الاستخدام يمكنك الرجوع إليه عبر URI عند إصدار المؤهلات عبر API.`)
};

/**
* | output |
* | --- |
* | "Design your credential templates using the visual builder. Each template becomes a reusable Boost that you can reference by URI when issuing credentials via ..." |
*
* @param {Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_createtemplatesstep_description4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Createtemplatesstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_createtemplatesstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_createtemplatesstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_createtemplatesstep_description4(inputs)
	return ar_developerportal_guides_issuecredentials_createtemplatesstep_description4(inputs)
});
export { developerportal_guides_issuecredentials_createtemplatesstep_description4 as "developerPortal.guides.issueCredentials.createTemplatesStep.description" }