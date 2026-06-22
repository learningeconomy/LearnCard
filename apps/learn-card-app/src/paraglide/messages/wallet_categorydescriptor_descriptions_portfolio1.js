/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs */

const en_wallet_categorydescriptor_descriptions_portfolio1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A portfolio is a curated collection of an individual's work, projects, or achievements that showcase their skills, experience, and growth over time. It serves as tangible proof of capability and creativity, often spanning professional, academic, or personal domains, and is used to demonstrate value to potential collaborators, employers, or audiences.`)
};

const es_wallet_categorydescriptor_descriptions_portfolio1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un portafolio es una colección curada del trabajo, los proyectos o los logros de una persona que muestran sus habilidades, experiencia y crecimiento a lo largo del tiempo. Sirve como prueba tangible de capacidad y creatividad, a menudo abarcando ámbitos profesionales, académicos o personales, y se utiliza para demostrar el valor ante posibles colaboradores, empleadores o audiencias.`)
};

const fr_wallet_categorydescriptor_descriptions_portfolio1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un portfolio est une collection soigneusement sélectionnée des travaux, des projets ou des réalisations d'une personne, qui met en valeur ses compétences, son expérience et son évolution au fil du temps. Il constitue une preuve tangible de capacité et de créativité, couvrant souvent les domaines professionnel, académique ou personnel, et sert à démontrer sa valeur auprès de collaborateurs, d'employeurs ou de publics potentiels.`)
};

const ar_wallet_categorydescriptor_descriptions_portfolio1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف الأعمال هو مجموعة منتقاة من أعمال الفرد أو مشاريعه أو إنجازاته تُبرز مهاراته وخبرته ونموّه عبر الزمن. ويُعدّ دليلاً ملموساً على القدرة والإبداع، وغالباً ما يشمل المجالات المهنية أو الأكاديمية أو الشخصية، ويُستخدم لإظهار القيمة أمام المتعاونين أو أصحاب العمل أو الجمهور المحتملين.`)
};

/**
* | output |
* | --- |
* | "A portfolio is a curated collection of an individual's work, projects, or achievements that showcase their skills, experience, and growth over time. It serve..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_portfolio1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Portfolio1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_portfolio1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_portfolio1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_portfolio1(inputs)
	return ar_wallet_categorydescriptor_descriptions_portfolio1(inputs)
});
export { wallet_categorydescriptor_descriptions_portfolio1 as "wallet.categoryDescriptor.descriptions.portfolio" }