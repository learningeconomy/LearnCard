/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Loading_SavingInputs */

const en_boost_cms_loading_saving = /** @type {(inputs: Boost_Cms_Loading_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving boost...`)
};

const es_boost_cms_loading_saving = /** @type {(inputs: Boost_Cms_Loading_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando Boost...`)
};

const fr_boost_cms_loading_saving = /** @type {(inputs: Boost_Cms_Loading_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement du Boost...`)
};

const ar_boost_cms_loading_saving = /** @type {(inputs: Boost_Cms_Loading_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ حفظ Boost...`)
};

/**
* | output |
* | --- |
* | "Saving boost..." |
*
* @param {Boost_Cms_Loading_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_loading_saving = /** @type {((inputs?: Boost_Cms_Loading_SavingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Loading_SavingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_loading_saving(inputs)
	if (locale === "es") return es_boost_cms_loading_saving(inputs)
	if (locale === "fr") return fr_boost_cms_loading_saving(inputs)
	return ar_boost_cms_loading_saving(inputs)
});
export { boost_cms_loading_saving as "boost.cms.loading.saving" }