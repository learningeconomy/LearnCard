import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct CredentialVerificationView: View {
    let credential: Credential
    @State private var expanded = false
    private var state: String { credential.isSample ? "sample" : credential.signatureState?.rawValue ?? "unavailable" }
    private var checked: Bool { !credential.isSample && credential.signatureState == .verified }

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            VStack(alignment: .leading, spacing: 10) {
                Text(NativeText.text("credential.details.verificationScope"))
                Label(NativeText.text("credential.details.issuerUnchecked"), systemImage: "person.crop.circle.badge.questionmark")
                Label(NativeText.text("credential.details.statusUnchecked"), systemImage: "questionmark.circle")
            }.font(.footnote).foregroundStyle(Palette.secondary).padding(.top, 12)
                .fixedSize(horizontal: false, vertical: true)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: checked ? "checkmark.seal.fill" : credential.isSample ? "sparkles" : "questionmark.seal")
                    .font(.title2).foregroundStyle(checked ? Palette.green : Palette.secondary)
                    .frame(width: 44, height: 44).background(checked ? Palette.mint : Palette.paper, in: Circle())
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(NativeText.text("credential.details.signature.\(state)"))
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                        .accessibilityIdentifier("credential-verification-title")
                    Text(NativeText.text(checked ? "credential.details.signatureScope" : "credential.details.verificationHint"))
                        .font(.caption).foregroundStyle(Palette.secondary)
                }.fixedSize(horizontal: false, vertical: true)
            }.padding(.vertical, 2)
        }.tint(Palette.secondary).padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityIdentifier("credential-verification")
    }
}

/// Measure actual truncation so larger text never loses access to the rest of a short paragraph.
struct CredentialExpandableText: View {
    let text: String
    let identifier: String
    @State private var expanded = false
    @State private var fullHeight: CGFloat = 0
    @State private var visibleHeight: CGFloat = 0
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(text).lineLimit(expanded ? nil : 4).fixedSize(horizontal: false, vertical: true)
                .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { visibleHeight = $0 }
                .background(alignment: .topLeading) {
                    Text(text).lineLimit(nil).fixedSize(horizontal: false, vertical: true)
                        .textSelection(.disabled).opacity(0).allowsHitTesting(false).accessibilityHidden(true)
                        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { fullHeight = $0 }
                }
            if expanded || fullHeight > visibleHeight + 1 {
                Button { expanded.toggle() } label: {
                    Text(NativeText.text(expanded ? "credential.details.showLess" : "credential.details.showMore"))
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green).frame(minHeight: 44)
                        .contentShape(Rectangle())
                }.buttonStyle(CredentialPressStyle())
                    .accessibilityIdentifier("\(identifier)-expand")
            }
        }.font(.subheadline).foregroundStyle(Palette.secondary).textSelection(.enabled)
    }
}

struct CredentialOptionalDetails: View {
    let details: CredentialDetails
    @State private var allCriteria = false
    @State private var allAlignments = false
    @State private var allEvidence = false
    @State private var allResults = false

    var body: some View {
        if !details.criteria.isEmpty {
            section("criteria") {
                ForEach(Array(details.criteria.prefix(allCriteria ? details.criteria.count : 3).enumerated()), id: \.offset) { index, entry in
                    narrative(entry, identifier: "credential-criteria-\(index)", linkKey: "criteriaLink")
                    if index < min(details.criteria.count, allCriteria ? details.criteria.count : 3) - 1 { Divider() }
                }
                if details.criteria.count > 3 { showAll($allCriteria, count: details.criteria.count, id: "credential-criteria-all") }
            }
        }
        if !details.alignments.isEmpty {
            section("alignments") {
                ForEach(Array(details.alignments.prefix(allAlignments ? details.alignments.count : 3).enumerated()), id: \.offset) { index, alignment in
                    VStack(alignment: .leading, spacing: 6) {
                        Label(alignment.name.isEmpty ? NativeText.text("credential.details.alignment") : alignment.name, systemImage: "link")
                            .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                        let reference = [alignment.framework, alignment.code].filter { !$0.isEmpty }.joined(separator: " · ")
                        if !reference.isEmpty { Text(reference).font(.caption).foregroundStyle(Palette.secondary) }
                        if !alignment.text.isEmpty { CredentialExpandableText(text: alignment.text, identifier: "credential-alignment-\(index)") }
                        referenceLink(alignment.url, title: "alignmentLink")
                    }.accessibilityElement(children: .contain).accessibilityIdentifier("credential-alignment-\(index)")
                    if index < min(details.alignments.count, allAlignments ? details.alignments.count : 3) - 1 { Divider() }
                }
                if details.alignments.count > 3 { showAll($allAlignments, count: details.alignments.count, id: "credential-alignments-all") }
            }
        }
        if !details.results.isEmpty {
            section("results") {
                ForEach(Array(details.results.prefix(allResults ? details.results.count : 3).enumerated()), id: \.offset) { index, result in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(result.name.isEmpty ? NativeText.text("credential.details.result") : result.name).font(.subheadline.weight(.semibold))
                        if !result.value.isEmpty { Text(result.value).font(.title3.weight(.semibold)) }
                        if !result.type.isEmpty { Text(result.type).font(.caption).foregroundStyle(Palette.secondary) }
                        if !result.text.isEmpty { CredentialExpandableText(text: result.text, identifier: "credential-result-\(index)") }
                    }.foregroundStyle(Palette.ink)
                }
                if details.results.count > 3 { showAll($allResults, count: details.results.count, id: "credential-results-all") }
            }
        }
        if !details.evidence.isEmpty {
            section("evidence") {
                ForEach(Array(details.evidence.prefix(allEvidence ? details.evidence.count : 3).enumerated()), id: \.offset) { index, entry in
                    narrative(entry, identifier: "credential-evidence-\(index)", linkKey: "evidenceLink")
                    if index < min(details.evidence.count, allEvidence ? details.evidence.count : 3) - 1 { Divider() }
                }
                if details.evidence.count > 3 { showAll($allEvidence, count: details.evidence.count, id: "credential-evidence-all") }
            }
        }
    }

    private func section<Content: View>(_ key: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("credential.details.\(key)")).font(.headline).foregroundStyle(Palette.ink)
            content()
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("credential-\(key)")
    }
    private func narrative(_ entry: CredentialNarrative, identifier: String, linkKey: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if !entry.name.isEmpty { Text(entry.name).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink) }
            if !entry.text.isEmpty { CredentialExpandableText(text: entry.text, identifier: identifier) }
            referenceLink(entry.url, title: linkKey)
        }.accessibilityElement(children: .contain).accessibilityIdentifier(identifier)
    }
    @ViewBuilder private func referenceLink(_ url: URL?, title: String) -> some View {
        if let url, CredentialDraftDetails.isWebURL(url.absoluteString) {
            Link(destination: url) {
                Label(NativeText.text("credential.details.\(title)"), systemImage: "arrow.up.right")
                    .font(.subheadline.weight(.medium)).foregroundStyle(Palette.green).frame(minHeight: 44)
            }.accessibilityHint(url.host ?? "")
        }
    }
    private func showAll(_ expanded: Binding<Bool>, count: Int, id: String) -> some View {
        Button { expanded.wrappedValue.toggle() } label: {
            Text(expanded.wrappedValue ? NativeText.text("credential.details.showLess") : NativeText.count("credential.details.showAll", count))
                .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green).frame(minHeight: 44).contentShape(Rectangle())
        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier(id)
    }
}
