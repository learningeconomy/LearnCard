# AppStoreSendAppNotificationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**recipient** | **str** |  | 
**title** | **str** |  | [optional] 
**body** | **str** |  | [optional] 
**action_path** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**priority** | **str** |  | [optional] [default to 'normal']

## Example

```python
from openapi_client.models.app_store_send_app_notification_request import AppStoreSendAppNotificationRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSendAppNotificationRequest from a JSON string
app_store_send_app_notification_request_instance = AppStoreSendAppNotificationRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreSendAppNotificationRequest.to_json())

# convert the object into a dict
app_store_send_app_notification_request_dict = app_store_send_app_notification_request_instance.to_dict()
# create an instance of AppStoreSendAppNotificationRequest from a dict
app_store_send_app_notification_request_from_dict = AppStoreSendAppNotificationRequest.from_dict(app_store_send_app_notification_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


