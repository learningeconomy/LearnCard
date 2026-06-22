/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Confirm_Publishednoedits2Inputs */

const en_boost_cms_confirm_publishednoedits2 = /** @type {(inputs: Boost_Cms_Confirm_Publishednoedits2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your boost is published and no more edits can be made. You can return to issuing or quit to start over.`)
};

const es_boost_cms_confirm_publishednoedits2 = /** @type {(inputs: Boost_Cms_Confirm_Publishednoedits2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu boost está publicado y no se pueden hacer más ediciones. Puedes volver a emitir o salir para comenzar de nuevo.`)
};

const fr_boost_cms_confirm_publishednoedits2 = /** @type {(inputs: Boost_Cms_Confirm_Publishednoedits2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre boost est publié et ne peut plus être modifié. Vous pouvez revenir à l'émission ou quitter pour recommencer.`)
};

const ar_boost_cms_confirm_publishednoedits2 = /** @type {(inputs: Boost_Cms_Confirm_Publishednoedits2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نشر البوست الخاص بك ولا يمكن إجراء المزيد من التعديلات. يمكنك العودة إلى الإصدار أو الخروج للبدء من جديد.`)
};

/**
* | output |
* | --- |
* | "Your boost is published and no more edits can be made. You can return to issuing or quit to start over." |
*
* @param {Boost_Cms_Confirm_Publishednoedits2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_confirm_publishednoedits2 = /** @type {((inputs?: Boost_Cms_Confirm_Publishednoedits2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Confirm_Publishednoedits2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_confirm_publishednoedits2(inputs)
	if (locale === "es") return es_boost_cms_confirm_publishednoedits2(inputs)
	if (locale === "fr") return fr_boost_cms_confirm_publishednoedits2(inputs)
	return ar_boost_cms_confirm_publishednoedits2(inputs)
});
export { boost_cms_confirm_publishednoedits2 as "boost.cms.confirm.publishedNoEdits" }