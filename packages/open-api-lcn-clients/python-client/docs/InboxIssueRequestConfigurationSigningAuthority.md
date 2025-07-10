# InboxIssueRequestConfigurationSigningAuthority

The signing authority to use for the credential. If not provided, the users default signing authority will be used if the credential is not signed.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration_signing_authority import InboxIssueRequestConfigurationSigningAuthority

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfigurationSigningAuthority from a JSON string
inbox_issue_request_configuration_signing_authority_instance = InboxIssueRequestConfigurationSigningAuthority.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfigurationSigningAuthority.to_json())

# convert the object into a dict
inbox_issue_request_configuration_signing_authority_dict = inbox_issue_request_configuration_signing_authority_instance.to_dict()
# create an instance of InboxIssueRequestConfigurationSigningAuthority from a dict
inbox_issue_request_configuration_signing_authority_from_dict = InboxIssueRequestConfigurationSigningAuthority.from_dict(inbox_issue_request_configuration_signing_authority_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


