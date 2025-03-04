import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { Button } from '@/components/ui/button';
// Import shadcn components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PersonalInfoSchema, type PersonalInfo } from '@/store/schema';
import { setPersonalInfo } from '@/store/slices/applicantSlice';

export default function PersonalInfoPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const form = useForm<PersonalInfo>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = (data: PersonalInfo) => {
    dispatch(setPersonalInfo(data));
    router.push('/work-experience');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Personal Information</h1>
      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Next Step
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
