import { Injectable } from '@angular/core';
import { ActionSheetController, ActionSheetOptions } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ActionSheetService {
  constructor(private readonly actionSheetCtrl: ActionSheetController) {}

  showDeletionConfirmation = async (message: string): Promise<string> =>
    await this.showActionSheet({
      header: 'Confirm Deletion',
      subHeader: message,
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          data: { action: 'delete' },
          icon: 'trash',
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: { action: 'cancel' },
          icon: 'close',
        },
      ],
    });

  showUpdateConfirmation = async (): Promise<string> =>
    await this.showActionSheet({
      header: 'Update Available',
      subHeader: 'An update is available for installation. Would you like to update now? Unsaved changes will be lost!',
      buttons: [
        {
          text: 'Update',
          data: { action: 'update' },
          icon: 'refresh-outline',
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: { action: 'cancel' },
          icon: 'close',
        },
      ],
    });

  // --------------
  // Helper methods
  // --------------

  private async showActionSheet(actionSheetOptions: ActionSheetOptions): Promise<string> {
    const actionSheet = await this.actionSheetCtrl.create(actionSheetOptions);
    actionSheet.present();
    const { data } = await actionSheet.onDidDismiss();
    return data?.action;
  }
}
