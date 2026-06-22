/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Confirm_Quitwithoutsaving2Inputs */

const en_boost_cms_confirm_quitwithoutsaving2 = /** @type {(inputs: Boost_Cms_Confirm_Quitwithoutsaving2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quit Without Saving`)
};

const es_boost_cms_confirm_quitwithoutsaving2 = /** @type {(inputs: Boost_Cms_Confirm_Quitwithoutsaving2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir sin guardar`)
};

const fr_boost_cms_confirm_quitwithoutsaving2 = /** @type {(inputs: Boost_Cms_Confirm_Quitwithoutsaving2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter sans enregistrer`)
};

const ar_boost_cms_confirm_quitwithoutsaving2 = /** @type {(inputs: Boost_Cms_Confirm_Quitwithoutsaving2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخروج بدون حفظ`)
};

/**
* | output |
* | --- |
* | "Quit Without Saving" |
*
* @param {Boost_Cms_Confirm_Quitwithoutsaving2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_confirm_quitwithoutsaving2 = /** @type {((inputs?: Boost_Cms_Confirm_Quitwithoutsaving2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Confirm_Quitwithoutsaving2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_confirm_quitwithoutsaving2(inputs)
	if (locale === "es") return es_boost_cms_confirm_quitwithoutsaving2(inputs)
	if (locale === "fr") return fr_boost_cms_confirm_quitwithoutsaving2(inputs)
	return ar_boost_cms_confirm_quitwithoutsaving2(inputs)
});
export { boost_cms_confirm_quitwithoutsaving2 as "boost.cms.confirm.quitWithoutSaving" }