/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Flowstep44Inputs */

const en_developerportal_integrationguide_aitutor_flowstep44 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirected to your app with ?did=...&topic=...`)
};

const es_developerportal_integrationguide_aitutor_flowstep44 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirigido a tu aplicación con ?did=...&topic=...`)
};

const fr_developerportal_integrationguide_aitutor_flowstep44 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirigé vers votre application avec ?did=...&topic=...`)
};

const ar_developerportal_integrationguide_aitutor_flowstep44 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إعادة التوجيه إلى تطبيقك مع ?did=...&topic=...`)
};

/**
* | output |
* | --- |
* | "Redirected to your app with ?did=...&topic=..." |
*
* @param {Developerportal_Integrationguide_Aitutor_Flowstep44Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_flowstep44 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Flowstep44Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Flowstep44Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_flowstep44(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_flowstep44(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_flowstep44(inputs)
	return ar_developerportal_integrationguide_aitutor_flowstep44(inputs)
});
export { developerportal_integrationguide_aitutor_flowstep44 as "developerPortal.integrationGuide.aiTutor.flowStep4" }