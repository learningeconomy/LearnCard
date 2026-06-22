/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs */

const en_developerportal_integrationguide_iframe_step4deschasperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your selected permissions, here are the methods you can use:`)
};

const es_developerportal_integrationguide_iframe_step4deschasperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Según los permisos seleccionados, estos son los métodos que puedes usar:`)
};

const fr_developerportal_integrationguide_iframe_step4deschasperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`D'après les permissions sélectionnées, voici les méthodes que vous pouvez utiliser :`)
};

const ar_developerportal_integrationguide_iframe_step4deschasperms5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناءً على الصلاحيات المحددة، هذه هي الطرق التي يمكنك استخدامها:`)
};

/**
* | output |
* | --- |
* | "Based on your selected permissions, here are the methods you can use:" |
*
* @param {Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step4deschasperms5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step4deschasperms5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step4deschasperms5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step4deschasperms5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step4deschasperms5(inputs)
	return ar_developerportal_integrationguide_iframe_step4deschasperms5(inputs)
});
export { developerportal_integrationguide_iframe_step4deschasperms5 as "developerPortal.integrationGuide.iframe.step4DescHasPerms" }