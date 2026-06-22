/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs */

const en_developerportal_onboarding_templatebuilder_editinghint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill in your template details, then click "Create Template" to save it.`)
};

const es_developerportal_onboarding_templatebuilder_editinghint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa los detalles de tu plantilla, luego haz clic en "Crear Plantilla" para guardarla.`)
};

const fr_developerportal_onboarding_templatebuilder_editinghint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplissez les détails de votre modèle, puis cliquez sur "Créer un Modèle" pour l'enregistrer.`)
};

const ar_developerportal_onboarding_templatebuilder_editinghint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`املأ تفاصيل القالب الخاص بك، ثم انقر فوق "إنشاء قالب" لحفظه.`)
};

/**
* | output |
* | --- |
* | "Fill in your template details, then click \"Create Template\" to save it." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_editinghint3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Editinghint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_editinghint3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_editinghint3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_editinghint3(inputs)
	return ar_developerportal_onboarding_templatebuilder_editinghint3(inputs)
});
export { developerportal_onboarding_templatebuilder_editinghint3 as "developerPortal.onboarding.templateBuilder.editingHint" }