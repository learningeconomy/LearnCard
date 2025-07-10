# InboxIssueRequestConfiguration

Configuration for the credential issuance. If not provided, the default configuration will be used.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**signing_authority** | [**InboxIssueRequestConfigurationSigningAuthority**](InboxIssueRequestConfigurationSigningAuthority.md) |  | [optional] 
**webhook_url** | **str** | The webhook URL to receive credential issuance events. | [optional] 
**expires_in_days** | **float** | The number of days the credential will be valid for. | [optional] 
**delivery** | [**InboxIssueRequestConfigurationDelivery**](InboxIssueRequestConfigurationDelivery.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration import InboxIssueRequestConfiguration

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfiguration from a JSON string
inbox_issue_request_configuration_instance = InboxIssueRequestConfiguration.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfiguration.to_json())

# convert the object into a dict
inbox_issue_request_configuration_dict = inbox_issue_request_configuration_instance.to_dict()
# create an instance of InboxIssueRequestConfiguration from a dict
inbox_issue_request_configuration_from_dict = InboxIssueRequestConfiguration.from_dict(inbox_issue_request_configuration_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


