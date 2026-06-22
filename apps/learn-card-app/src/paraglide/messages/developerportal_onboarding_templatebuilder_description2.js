/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Description2Inputs */

const en_developerportal_onboarding_templatebuilder_description2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Templates define the structure of credentials you'll issue. Each template is saved as a reusable boost that can be issued to recipients.`)
};

const es_developerportal_onboarding_templatebuilder_description2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las plantillas definen la estructura de las credenciales que emitirás. Cada plantilla se guarda como un boost reutilizable que se puede emitir a los destinatarios.`)
};

const fr_developerportal_onboarding_templatebuilder_description2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les modèles définissent la structure des credentials que vous émettrez. Chaque modèle est enregistré comme un boost réutilisable pouvant être émis aux destinataires.`)
};

const ar_developerportal_onboarding_templatebuilder_description2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحدد القوالب هيكل بيانات الاعتماد التي ستصدرها. يتم حفظ كل قالب كمعزز قابل لإعادة الاستخدام يمكن إصداره للمستلمين.`)
};

/**
* | output |
* | --- |
* | "Templates define the structure of credentials you'll issue. Each template is saved as a reusable boost that can be issued to recipients." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_description2 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_description2(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_description2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_description2(inputs)
	return ar_developerportal_onboarding_templatebuilder_description2(inputs)
});
export { developerportal_onboarding_templatebuilder_description2 as "developerPortal.onboarding.templateBuilder.description" }