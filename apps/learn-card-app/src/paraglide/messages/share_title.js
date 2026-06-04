/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_TitleInputs */

const en_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const de_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teilen`)
};

const ar_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

const fr_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ko_share_title = /** @type {(inputs: Share_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Share_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_title = /** @type {((inputs?: Share_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_title(inputs)
	if (locale === "es") return es_share_title(inputs)
	if (locale === "de") return de_share_title(inputs)
	if (locale === "ar") return ar_share_title(inputs)
	if (locale === "fr") return fr_share_title(inputs)
	return ko_share_title(inputs)
});
export { share_title as "share.title" }