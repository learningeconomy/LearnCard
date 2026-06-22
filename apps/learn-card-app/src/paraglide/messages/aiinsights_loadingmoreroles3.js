/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Loadingmoreroles3Inputs */

const en_aiinsights_loadingmoreroles3 = /** @type {(inputs: Aiinsights_Loadingmoreroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading more roles...`)
};

const es_aiinsights_loadingmoreroles3 = /** @type {(inputs: Aiinsights_Loadingmoreroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando más roles...`)
};

const fr_aiinsights_loadingmoreroles3 = /** @type {(inputs: Aiinsights_Loadingmoreroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement d'autres rôles...`)
};

const ar_aiinsights_loadingmoreroles3 = /** @type {(inputs: Aiinsights_Loadingmoreroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري تحميل المزيد من الأدوار`)
};

/**
* | output |
* | --- |
* | "Loading more roles..." |
*
* @param {Aiinsights_Loadingmoreroles3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_loadingmoreroles3 = /** @type {((inputs?: Aiinsights_Loadingmoreroles3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Loadingmoreroles3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_loadingmoreroles3(inputs)
	if (locale === "es") return es_aiinsights_loadingmoreroles3(inputs)
	if (locale === "fr") return fr_aiinsights_loadingmoreroles3(inputs)
	return ar_aiinsights_loadingmoreroles3(inputs)
});
export { aiinsights_loadingmoreroles3 as "aiInsights.loadingMoreRoles" }