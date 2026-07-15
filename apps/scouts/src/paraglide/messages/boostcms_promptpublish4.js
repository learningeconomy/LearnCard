/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Promptpublish4Inputs */

const en_boostcms_promptpublish4 = /** @type {(inputs: Boostcms_Promptpublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your boost is published and no more edits can be made. You can return to issuing or quit to start over.`)
};

const es_boostcms_promptpublish4 = /** @type {(inputs: Boostcms_Promptpublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu boost está publicado y no se pueden hacer más cambios. Puedes volver a emitir o salir para empezar de nuevo.`)
};

const fr_boostcms_promptpublish4 = /** @type {(inputs: Boostcms_Promptpublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Boost est publié et aucune modification supplémentaire n'est possible. Vous pouvez revenir à la délivrance ou quitter pour recommencer.`)
};

const ar_boostcms_promptpublish4 = /** @type {(inputs: Boostcms_Promptpublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نشر تعزيزك ولا يمكن إجراء مزيد من التعديلات. يمكنك العودة للإصدار أو الإنهاء للبدء من جديد.`)
};

/**
* | output |
* | --- |
* | "Your boost is published and no more edits can be made. You can return to issuing or quit to start over." |
*
* @param {Boostcms_Promptpublish4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_promptpublish4 = /** @type {((inputs?: Boostcms_Promptpublish4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Promptpublish4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_promptpublish4(inputs)
	if (locale === "es") return es_boostcms_promptpublish4(inputs)
	if (locale === "fr") return fr_boostcms_promptpublish4(inputs)
	return ar_boostcms_promptpublish4(inputs)
});
export { boostcms_promptpublish4 as "boostCMS.promptPublish" }