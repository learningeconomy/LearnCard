/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Leavepage_Body1Inputs */

const en_boost_cms_leavepage_body1 = /** @type {(inputs: Boost_Cms_Leavepage_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have unsaved changes. Your progress will be saved locally and you can continue editing later.`)
};

const es_boost_cms_leavepage_body1 = /** @type {(inputs: Boost_Cms_Leavepage_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tienes cambios sin guardar. Tu progreso se guardará localmente y podrás continuar editando más tarde.`)
};

const fr_boost_cms_leavepage_body1 = /** @type {(inputs: Boost_Cms_Leavepage_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez des modifications non enregistrées. Votre progression sera enregistrée localement et vous pourrez continuer à modifier plus tard.`)
};

const ar_boost_cms_leavepage_body1 = /** @type {(inputs: Boost_Cms_Leavepage_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لديك تغييرات غير محفوظة. سيتم حفظ تقدّمك محليًا ويمكنك متابعة التحرير لاحقًا.`)
};

/**
* | output |
* | --- |
* | "You have unsaved changes. Your progress will be saved locally and you can continue editing later." |
*
* @param {Boost_Cms_Leavepage_Body1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_leavepage_body1 = /** @type {((inputs?: Boost_Cms_Leavepage_Body1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Leavepage_Body1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_leavepage_body1(inputs)
	if (locale === "es") return es_boost_cms_leavepage_body1(inputs)
	if (locale === "fr") return fr_boost_cms_leavepage_body1(inputs)
	return ar_boost_cms_leavepage_body1(inputs)
});
export { boost_cms_leavepage_body1 as "boost.cms.leavePage.body" }