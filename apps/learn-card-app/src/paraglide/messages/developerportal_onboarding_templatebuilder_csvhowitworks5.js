/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs */

const en_developerportal_onboarding_templatebuilder_csvhowitworks5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`We'll create ${i?.count} separate boosts — one for each course. Course data (name, credits, etc.) will be baked in. Recipient data (name, date) stays dynamic for issuance.`)
};

const es_developerportal_onboarding_templatebuilder_csvhowitworks5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crearemos ${i?.count} boosts separados — uno por cada curso. Los datos del curso (nombre, créditos, etc.) se incorporarán. Los datos del destinatario (nombre, fecha) se mantienen dinámicos para la emisión.`)
};

const fr_developerportal_onboarding_templatebuilder_csvhowitworks5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nous allons créer ${i?.count} boosts distincts — un pour chaque cours. Les données du cours (nom, crédits, etc.) sont intégrées. Les données du destinataire (nom, date) restent dynamiques pour l'émission.`)
};

const ar_developerportal_onboarding_templatebuilder_csvhowitworks5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سننشئ ${i?.count} معززاً منفصلاً — واحد لكل دورة. سيتم دمج بيانات الدورة (الاسم، الساعات المعتمدة، إلخ). تبقى بيانات المستلم (الاسم، التاريخ) ديناميكية للإصدار.`)
};

/**
* | output |
* | --- |
* | "We'll create {count} separate boosts — one for each course. Course data (name, credits, etc.) will be baked in. Recipient data (name, date) stays dynamic for..." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvhowitworks5 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvhowitworks5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvhowitworks5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvhowitworks5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvhowitworks5(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvhowitworks5(inputs)
});
export { developerportal_onboarding_templatebuilder_csvhowitworks5 as "developerPortal.onboarding.templateBuilder.csvHowItWorks" }