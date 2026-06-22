/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Studies1Inputs */

const en_wallet_categorydescriptor_descriptions_studies1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Studies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Studies are structured programs of learning designed to impart knowledge or skills in specific subjects or areas. They can range from academic disciplines and vocational training to professional development and personal interests. Studies are offered in various formats, including in-person classroom settings, online platforms, or hybrid arrangements.`)
};

const es_wallet_categorydescriptor_descriptions_studies1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Studies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los estudios son programas de aprendizaje estructurados diseñados para impartir conocimientos o habilidades en materias o áreas específicas. Pueden abarcar desde disciplinas académicas y formación profesional hasta el desarrollo profesional y los intereses personales. Los estudios se ofrecen en distintos formatos, incluyendo clases presenciales, plataformas en línea o modalidades híbridas.`)
};

const fr_wallet_categorydescriptor_descriptions_studies1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Studies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les études sont des programmes d'apprentissage structurés conçus pour transmettre des connaissances ou des compétences dans des matières ou des domaines précis. Elles peuvent aller des disciplines académiques et de la formation professionnelle au développement professionnel et aux centres d'intérêt personnels. Les études sont proposées sous différents formats, notamment en présentiel, sur des plateformes en ligne ou selon des formules hybrides.`)
};

const ar_wallet_categorydescriptor_descriptions_studies1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Studies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدراسات هي برامج تعلّم منظَّمة مصمَّمة لنقل المعرفة أو المهارات في مواضيع أو مجالات محددة. وقد تتراوح بين التخصصات الأكاديمية والتدريب المهني وصولاً إلى التطوير المهني والاهتمامات الشخصية. وتُقدَّم الدراسات بأشكال متنوعة، منها الحضور الشخصي في القاعات الدراسية أو المنصات الإلكترونية أو الترتيبات الهجينة.`)
};

/**
* | output |
* | --- |
* | "Studies are structured programs of learning designed to impart knowledge or skills in specific subjects or areas. They can range from academic disciplines an..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Studies1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_studies1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Studies1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Studies1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_studies1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_studies1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_studies1(inputs)
	return ar_wallet_categorydescriptor_descriptions_studies1(inputs)
});
export { wallet_categorydescriptor_descriptions_studies1 as "wallet.categoryDescriptor.descriptions.studies" }