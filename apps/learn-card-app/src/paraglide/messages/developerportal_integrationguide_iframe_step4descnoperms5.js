/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs */

const en_developerportal_integrationguide_iframe_step4descnoperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select permissions above to see relevant API methods. Here are some common ones:`)
};

const es_developerportal_integrationguide_iframe_step4descnoperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona permisos arriba para ver métodos relevantes de la API. Aquí hay algunos comunes:`)
};

const fr_developerportal_integrationguide_iframe_step4descnoperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez les permissions ci-dessus pour voir les méthodes API pertinentes. Voici quelques méthodes courantes :`)
};

const ar_developerportal_integrationguide_iframe_step4descnoperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد الصلاحيات أعلاه لرؤية طرق API ذات الصلة. فيما يلي بعض الطرق الشائعة:`)
};

/**
* | output |
* | --- |
* | "Select permissions above to see relevant API methods. Here are some common ones:" |
*
* @param {Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step4descnoperms5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step4descnoperms5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step4descnoperms5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step4descnoperms5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step4descnoperms5(inputs)
	return ar_developerportal_integrationguide_iframe_step4descnoperms5(inputs)
});
export { developerportal_integrationguide_iframe_step4descnoperms5 as "developerPortal.integrationGuide.iframe.step4DescNoPerms" }