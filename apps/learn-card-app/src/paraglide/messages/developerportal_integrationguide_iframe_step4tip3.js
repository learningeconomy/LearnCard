/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Integrationguide_Iframe_Step4tip3Inputs */

const en_developerportal_integrationguide_iframe_step4tip3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4tip3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Select ${i?.count} permission(s). The methods above correspond to your selections.`)
};

const es_developerportal_integrationguide_iframe_step4tip3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4tip3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Has seleccionado ${i?.count} permiso(s). Los métodos anteriores corresponden a tus selecciones.`)
};

const fr_developerportal_integrationguide_iframe_step4tip3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4tip3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous avez sélectionné ${i?.count} permission(s). Les méthodes ci-dessus correspondent à vos sélections.`)
};

const ar_developerportal_integrationguide_iframe_step4tip3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4tip3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لقد حددت ${i?.count} صلاحية (صلاحيات). الطرق أعلاه تتوافق مع اختياراتك.`)
};

/**
* | output |
* | --- |
* | "Select {count} permission(s). The methods above correspond to your selections." |
*
* @param {Developerportal_Integrationguide_Iframe_Step4tip3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step4tip3 = /** @type {((inputs: Developerportal_Integrationguide_Iframe_Step4tip3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step4tip3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step4tip3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step4tip3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step4tip3(inputs)
	return ar_developerportal_integrationguide_iframe_step4tip3(inputs)
});
export { developerportal_integrationguide_iframe_step4tip3 as "developerPortal.integrationGuide.iframe.step4Tip" }