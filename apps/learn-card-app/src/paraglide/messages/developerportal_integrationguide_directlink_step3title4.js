/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step3title4Inputs */

const en_developerportal_integrationguide_directlink_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify User Identity (Optional)`)
};

const es_developerportal_integrationguide_directlink_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Identidad del Usuario (Opcional)`)
};

const fr_developerportal_integrationguide_directlink_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier l'Identité de l'Utilisateur (Optionnel)`)
};

const ar_developerportal_integrationguide_directlink_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من هوية المستخدم (اختياري)`)
};

/**
* | output |
* | --- |
* | "Verify User Identity (Optional)" |
*
* @param {Developerportal_Integrationguide_Directlink_Step3title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step3title4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step3title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step3title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step3title4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step3title4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step3title4(inputs)
	return ar_developerportal_integrationguide_directlink_step3title4(inputs)
});
export { developerportal_integrationguide_directlink_step3title4 as "developerPortal.integrationGuide.directLink.step3Title" }